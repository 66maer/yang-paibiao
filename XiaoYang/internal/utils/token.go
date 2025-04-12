package utils

import (
	"errors"

	"github.com/go-dev-frame/sponge/pkg/jwt"
)

// TokenClaims represents the structure of the claims in the token
type TokenClaims struct {
	UserID   uint64 `json:"userId"`
	QQNumber string `json:"qqNumber"`
	Nickname string `json:"nickname"`
	IsAdmin  bool   `json:"isAdmin"`
	IsBot    bool   `json:"isBot"`
}

// ParseToken parses the given token string and returns the claims
func ParseToken(token string) (*TokenClaims, error) {
	if len(token) < 7 || token[:7] != "Bearer " {
		return nil, errors.New("invalid or missing token")
	}
	token = token[7:] // remove Bearer prefix
	claims, err := jwt.ParseCustomToken(token)
	if err != nil {
		return nil, err
	}

	// Extract fields from the claims
	userID, ok := claims.GetUint64("userId")
	if !ok {
		return nil, errors.New("invalid or missing userId in token")
	}

	qqNumber, ok := claims.GetString("qqNumber")
	if !ok {
		return nil, errors.New("invalid or missing qqNumber in token")
	}

	nickname, ok := claims.GetString("nickname")
	if !ok {
		return nil, errors.New("invalid or missing nickname in token")
	}

	isAdmin, ok := claims.Fields["isAdmin"].(bool)
	if !ok {
		return nil, errors.New("invalid or missing isAdmin in token")
	}

	isBot, ok := claims.Fields["isBot"].(bool)
	if !ok {
		return nil, errors.New("invalid or missing isBot in token")
	}

	// Return the parsed claims
	return &TokenClaims{
		UserID:   userID,
		QQNumber: qqNumber,
		Nickname: nickname,
		IsAdmin:  isAdmin,
		IsBot:    isBot,
	}, nil
}
