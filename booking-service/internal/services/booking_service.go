package services

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"booking-service/internal/models"
	"booking-service/pkg/amadeus"
	"booking-service/pkg/memcached"
	"booking-service/pkg/mysql"
)

type BookingService struct {
	db            *mysql.DB
	cache         *memcached.Client
	amadeusClient *amadeus.Client
	jwtSecret     string
}

func NewBookingService(db *mysql.DB, cache *memcached.Client, amadeusClient *amadeus.Client, jwtSecret string) *BookingService {
	return &BookingService{
		db:            db,
		cache:         cache,
		amadeusClient: amadeusClient,
		jwtSecret:     jwtSecret,
	}
}

// --- AUTH Y USERS -------------------------------------------------------------

func (s *BookingService) RegisterUser(req *models.RegisterRequest) (*models.User, error) {
	existingUser, err := s.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("el email %s ya está registrado", req.Email)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hasheando password: %v", err)
	}

	role := string(models.RoleUser)
	if req.Role != "" {
		role = string(req.Role)
	}

	query := `
		INSERT INTO users (email, password_hash, first_name, last_name, phone, date_of_birth, role)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	result, err := s.db.Exec(query, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.Phone, req.DateOfBirth, role)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return nil, fmt.Errorf("el email %s ya está registrado", req.Email)
		}
		return nil, fmt.Errorf("error creando usuario: %v", err)
	}

	userID, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("error obteniendo ID de usuario: %v", err)
	}

	return s.GetUserByID(int(userID))
}

func (s *BookingService) LoginUser(req *models.LoginRequest) (*models.User, string, error) {
	user, err := s.GetUserByEmail(req.Email)
	if err != nil {
		return nil, "", fmt.Errorf("usuario no encontrado")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, "", fmt.Errorf("credenciales inválidas")
	}

	token, err := s.generateJWTToken(user.ID)
	if err != nil {
		return nil, "", fmt.Errorf("error generando token: %v", err)
	}

	return user, token, nil
}

func (s *BookingService) GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone, date_of_birth, created_at, updated_at, is_active, role
		FROM users WHERE email = ? AND is_active = TRUE
	`

	var user models.User
	err := s.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.DateOfBirth, &user.CreatedAt, &user.UpdatedAt, &user.IsActive,
		&user.Role,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("usuario no encontrado")
		}
		return nil, fmt.Errorf("error obteniendo usuario: %v", err)
	}
	return &user, nil
}

func (s *BookingService) GetUserByID(userID int) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone, date_of_birth, created_at, updated_at, is_active, role
		FROM users WHERE id = ? AND is_active = TRUE
	`

	var user models.User
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.DateOfBirth, &user.CreatedAt, &user.UpdatedAt, &user.IsActive,
		&user.Role,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("usuario no encontrado")
		}
		return nil, fmt.Errorf("error obteniendo usuario: %v", err)
	}
	return &user, nil
}

// --- JWT -----------------------------------------------------------------------

func (s *BookingService) generateJWTToken(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *BookingService) ValidateJWTToken(tokenString string) (int, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return 0, fmt.Errorf("token inválido")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("claims inválidos")
	}
	userID, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fmt.Errorf("user_id inválido")
	}
	return int(userID), nil
}

func (s *BookingService) ValidateJWTTokenWithRole(tokenString string) (int, string, error) {
	userID, err := s.ValidateJWTToken(tokenString)
	if err != nil {
		return 0, "", err
	}
	user, err := s.GetUserByID(userID)
	if err != nil {
		return 0, "", err
	}
	return user.ID, string(user.Role), nil

}

// --- BOOKINGS ------------------------------------------------------------------

func (s *BookingService) CheckAvailability(req *models.AvailabilityRequest) (*models.AvailabilityResponse, error) {
	checkInStr := req.CheckInDate.Format("2006-01-02")
	checkOutStr := req.CheckOutDate.Format("2006-01-02")

	cacheKey := memcached.GenerateAvailabilityKey(req.HotelID, req.CheckInDate, req.CheckOutDate, req.Guests)
	var cached models.AvailabilityResponse
	if err := s.cache.Get(cacheKey, &cached); err == nil {
		return &cached, nil
	}

	offers, err := s.amadeusClient.GetHotelOffers(req.HotelID, checkInStr, checkOutStr, req.Guests)
	if err != nil || len(offers) == 0 || len(offers[0].Offers) == 0 {
		// fallback de simulación
		simulated := &models.AvailabilityResponse{
			HotelID:        req.HotelID,
			Available:      true,
			CheckInDate:    checkInStr,
			CheckOutDate:   checkOutStr,
			Guests:         req.Guests,
			Currency:       "ARS",
			RoomsAvailable: ptr(3),
			Price:          ptrFloat(15000 + float64(req.Guests)*3000),
		}
		s.cache.Set(cacheKey, simulated, 10*time.Second)
		return simulated, nil
	}

	priceFloat, _ := strconv.ParseFloat(offers[0].Offers[0].Price.Total, 64)
	resp := &models.AvailabilityResponse{
		HotelID:        req.HotelID,
		Available:      true,
		CheckInDate:    checkInStr,
		CheckOutDate:   checkOutStr,
		Guests:         req.Guests,
		Currency:       offers[0].Offers[0].Price.Currency,
		RoomsAvailable: &offers[0].Offers[0].RoomQuantity,
		Price:          &priceFloat,
	}
	s.cache.Set(cacheKey, resp, 10*time.Second)
	return resp, nil
}

func (s *BookingService) CreateBooking(userID int, req *models.CreateBookingRequest) (*models.Booking, error) {
	availReq := &models.AvailabilityRequest{
		HotelID:      req.HotelID,
		CheckInDate:  req.CheckInDate,
		CheckOutDate: req.CheckOutDate,
		Guests:       req.Guests,
	}
	availability, err := s.CheckAvailability(availReq)
	if err != nil {
		return nil, fmt.Errorf("error verificando disponibilidad: %v", err)
	}
	if !availability.Available {
		return nil, fmt.Errorf("hotel no disponible para las fechas seleccionadas")
	}

	query := `
		INSERT INTO bookings (user_id, internal_hotel_id, check_in_date, check_out_date, guests, room_type, total_price, currency, status, special_requests, booking_reference)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
	`
	bookingRef := fmt.Sprintf("BK%d%d", userID, time.Now().Unix())
	totalPrice := 0.0
	currency := "ARS"
	if availability.Price != nil {
		totalPrice = *availability.Price
	}
	if availability.Currency != "" {
		currency = availability.Currency
	}
	result, err := s.db.Exec(query, userID, req.HotelID, req.CheckInDate, req.CheckOutDate, req.Guests, req.RoomType, totalPrice, currency, req.SpecialRequests, bookingRef)
	if err != nil {
		return nil, fmt.Errorf("error creando reserva: %v", err)
	}
	bookingID, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("error obteniendo ID de reserva: %v", err)
	}
	return s.GetBookingByID(int(bookingID))
}

func (s *BookingService) GetUserBookings(userID int) ([]*models.Booking, error) {
	query := `
		SELECT id, user_id, internal_hotel_id, amadeus_hotel_id, amadeus_booking_id, check_in_date, check_out_date,
		       guests, room_type, total_price, currency, status, booking_reference, special_requests, created_at, updated_at
		FROM bookings WHERE user_id = ? ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*models.Booking
	for rows.Next() {
		var b models.Booking
		err := rows.Scan(
			&b.ID, &b.UserID, &b.InternalHotelID, &b.AmadeusHotelID, &b.AmadeusBookingID, &b.CheckInDate, &b.CheckOutDate,
			&b.Guests, &b.RoomType, &b.TotalPrice, &b.Currency, &b.Status, &b.BookingReference, &b.SpecialRequests,
			&b.CreatedAt, &b.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, &b)
	}
	return bookings, nil
}

func (s *BookingService) GetBookingByID(id int) (*models.Booking, error) {
	query := `
		SELECT id, user_id, internal_hotel_id, amadeus_hotel_id, amadeus_booking_id, check_in_date, check_out_date,
		       guests, room_type, total_price, currency, status, booking_reference, special_requests, created_at, updated_at
		FROM bookings WHERE id = ?
	`

	var b models.Booking
	err := s.db.QueryRow(query, id).Scan(
		&b.ID, &b.UserID, &b.InternalHotelID, &b.AmadeusHotelID, &b.AmadeusBookingID, &b.CheckInDate, &b.CheckOutDate,
		&b.Guests, &b.RoomType, &b.TotalPrice, &b.Currency, &b.Status, &b.BookingReference, &b.SpecialRequests,
		&b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// Helpers
func ptr(i int) *int           { return &i }
func ptrFloat(f float64) *float64 { return &f }
