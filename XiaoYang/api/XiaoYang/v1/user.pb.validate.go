// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: api/XiaoYang/v1/user.proto

package v1

import (
	"bytes"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"google.golang.org/protobuf/types/known/anypb"
)

// ensure the imports are used
var (
	_ = bytes.MinRead
	_ = errors.New("")
	_ = fmt.Print
	_ = utf8.UTFMax
	_ = (*regexp.Regexp)(nil)
	_ = (*strings.Reader)(nil)
	_ = net.IPv4len
	_ = time.Duration(0)
	_ = (*url.URL)(nil)
	_ = (*mail.Address)(nil)
	_ = anypb.Any{}
	_ = sort.Sort
)

// Validate checks the field values on RegisterRequest with the rules defined
// in the proto definition for this message. If any rules are violated, the
// first error encountered is returned, or nil if there are no violations.
func (m *RegisterRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on RegisterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// RegisterRequestMultiError, or nil if none found.
func (m *RegisterRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *RegisterRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for QqNumber

	// no validation rules for Password

	// no validation rules for Nickname

	if len(errors) > 0 {
		return RegisterRequestMultiError(errors)
	}

	return nil
}

// RegisterRequestMultiError is an error wrapping multiple validation errors
// returned by RegisterRequest.ValidateAll() if the designated constraints
// aren't met.
type RegisterRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m RegisterRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m RegisterRequestMultiError) AllErrors() []error { return m }

// RegisterRequestValidationError is the validation error returned by
// RegisterRequest.Validate if the designated constraints aren't met.
type RegisterRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e RegisterRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e RegisterRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e RegisterRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e RegisterRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e RegisterRequestValidationError) ErrorName() string { return "RegisterRequestValidationError" }

// Error satisfies the builtin error interface
func (e RegisterRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sRegisterRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = RegisterRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = RegisterRequestValidationError{}

// Validate checks the field values on RegisterResponse with the rules defined
// in the proto definition for this message. If any rules are violated, the
// first error encountered is returned, or nil if there are no violations.
func (m *RegisterResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on RegisterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// RegisterResponseMultiError, or nil if none found.
func (m *RegisterResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *RegisterResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Token

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for Nickname

	// no validation rules for Avatar

	if len(errors) > 0 {
		return RegisterResponseMultiError(errors)
	}

	return nil
}

// RegisterResponseMultiError is an error wrapping multiple validation errors
// returned by RegisterResponse.ValidateAll() if the designated constraints
// aren't met.
type RegisterResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m RegisterResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m RegisterResponseMultiError) AllErrors() []error { return m }

// RegisterResponseValidationError is the validation error returned by
// RegisterResponse.Validate if the designated constraints aren't met.
type RegisterResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e RegisterResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e RegisterResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e RegisterResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e RegisterResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e RegisterResponseValidationError) ErrorName() string { return "RegisterResponseValidationError" }

// Error satisfies the builtin error interface
func (e RegisterResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sRegisterResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = RegisterResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = RegisterResponseValidationError{}

// Validate checks the field values on LoginRequest with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *LoginRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on LoginRequest with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in LoginRequestMultiError, or
// nil if none found.
func (m *LoginRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *LoginRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for QqNumber

	// no validation rules for Password

	if len(errors) > 0 {
		return LoginRequestMultiError(errors)
	}

	return nil
}

// LoginRequestMultiError is an error wrapping multiple validation errors
// returned by LoginRequest.ValidateAll() if the designated constraints aren't met.
type LoginRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m LoginRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m LoginRequestMultiError) AllErrors() []error { return m }

// LoginRequestValidationError is the validation error returned by
// LoginRequest.Validate if the designated constraints aren't met.
type LoginRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e LoginRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e LoginRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e LoginRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e LoginRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e LoginRequestValidationError) ErrorName() string { return "LoginRequestValidationError" }

// Error satisfies the builtin error interface
func (e LoginRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sLoginRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = LoginRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = LoginRequestValidationError{}

// Validate checks the field values on LoginResponse with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *LoginResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on LoginResponse with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in LoginResponseMultiError, or
// nil if none found.
func (m *LoginResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *LoginResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Token

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for Nickname

	// no validation rules for Avatar

	if len(errors) > 0 {
		return LoginResponseMultiError(errors)
	}

	return nil
}

// LoginResponseMultiError is an error wrapping multiple validation errors
// returned by LoginResponse.ValidateAll() if the designated constraints
// aren't met.
type LoginResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m LoginResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m LoginResponseMultiError) AllErrors() []error { return m }

// LoginResponseValidationError is the validation error returned by
// LoginResponse.Validate if the designated constraints aren't met.
type LoginResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e LoginResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e LoginResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e LoginResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e LoginResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e LoginResponseValidationError) ErrorName() string { return "LoginResponseValidationError" }

// Error satisfies the builtin error interface
func (e LoginResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sLoginResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = LoginResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = LoginResponseValidationError{}

// Validate checks the field values on LogoutRequest with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *LogoutRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on LogoutRequest with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in LogoutRequestMultiError, or
// nil if none found.
func (m *LogoutRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *LogoutRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for UserId

	if len(errors) > 0 {
		return LogoutRequestMultiError(errors)
	}

	return nil
}

// LogoutRequestMultiError is an error wrapping multiple validation errors
// returned by LogoutRequest.ValidateAll() if the designated constraints
// aren't met.
type LogoutRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m LogoutRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m LogoutRequestMultiError) AllErrors() []error { return m }

// LogoutRequestValidationError is the validation error returned by
// LogoutRequest.Validate if the designated constraints aren't met.
type LogoutRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e LogoutRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e LogoutRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e LogoutRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e LogoutRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e LogoutRequestValidationError) ErrorName() string { return "LogoutRequestValidationError" }

// Error satisfies the builtin error interface
func (e LogoutRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sLogoutRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = LogoutRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = LogoutRequestValidationError{}

// Validate checks the field values on LogoutResponse with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *LogoutResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on LogoutResponse with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in LogoutResponseMultiError,
// or nil if none found.
func (m *LogoutResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *LogoutResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return LogoutResponseMultiError(errors)
	}

	return nil
}

// LogoutResponseMultiError is an error wrapping multiple validation errors
// returned by LogoutResponse.ValidateAll() if the designated constraints
// aren't met.
type LogoutResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m LogoutResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m LogoutResponseMultiError) AllErrors() []error { return m }

// LogoutResponseValidationError is the validation error returned by
// LogoutResponse.Validate if the designated constraints aren't met.
type LogoutResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e LogoutResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e LogoutResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e LogoutResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e LogoutResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e LogoutResponseValidationError) ErrorName() string { return "LogoutResponseValidationError" }

// Error satisfies the builtin error interface
func (e LogoutResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sLogoutResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = LogoutResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = LogoutResponseValidationError{}

// Validate checks the field values on GetUserInfoRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *GetUserInfoRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on GetUserInfoRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// GetUserInfoRequestMultiError, or nil if none found.
func (m *GetUserInfoRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *GetUserInfoRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return GetUserInfoRequestMultiError(errors)
	}

	return nil
}

// GetUserInfoRequestMultiError is an error wrapping multiple validation errors
// returned by GetUserInfoRequest.ValidateAll() if the designated constraints
// aren't met.
type GetUserInfoRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m GetUserInfoRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m GetUserInfoRequestMultiError) AllErrors() []error { return m }

// GetUserInfoRequestValidationError is the validation error returned by
// GetUserInfoRequest.Validate if the designated constraints aren't met.
type GetUserInfoRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e GetUserInfoRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e GetUserInfoRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e GetUserInfoRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e GetUserInfoRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e GetUserInfoRequestValidationError) ErrorName() string {
	return "GetUserInfoRequestValidationError"
}

// Error satisfies the builtin error interface
func (e GetUserInfoRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sGetUserInfoRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = GetUserInfoRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = GetUserInfoRequestValidationError{}

// Validate checks the field values on GetUserInfoResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *GetUserInfoResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on GetUserInfoResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// GetUserInfoResponseMultiError, or nil if none found.
func (m *GetUserInfoResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *GetUserInfoResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for Nickname

	// no validation rules for Avatar

	// no validation rules for IsAdmin

	if len(errors) > 0 {
		return GetUserInfoResponseMultiError(errors)
	}

	return nil
}

// GetUserInfoResponseMultiError is an error wrapping multiple validation
// errors returned by GetUserInfoResponse.ValidateAll() if the designated
// constraints aren't met.
type GetUserInfoResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m GetUserInfoResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m GetUserInfoResponseMultiError) AllErrors() []error { return m }

// GetUserInfoResponseValidationError is the validation error returned by
// GetUserInfoResponse.Validate if the designated constraints aren't met.
type GetUserInfoResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e GetUserInfoResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e GetUserInfoResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e GetUserInfoResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e GetUserInfoResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e GetUserInfoResponseValidationError) ErrorName() string {
	return "GetUserInfoResponseValidationError"
}

// Error satisfies the builtin error interface
func (e GetUserInfoResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sGetUserInfoResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = GetUserInfoResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = GetUserInfoResponseValidationError{}

// Validate checks the field values on UpdateUserInfoRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *UpdateUserInfoRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on UpdateUserInfoRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// UpdateUserInfoRequestMultiError, or nil if none found.
func (m *UpdateUserInfoRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *UpdateUserInfoRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for Nickname

	// no validation rules for Avatar

	if len(errors) > 0 {
		return UpdateUserInfoRequestMultiError(errors)
	}

	return nil
}

// UpdateUserInfoRequestMultiError is an error wrapping multiple validation
// errors returned by UpdateUserInfoRequest.ValidateAll() if the designated
// constraints aren't met.
type UpdateUserInfoRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m UpdateUserInfoRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m UpdateUserInfoRequestMultiError) AllErrors() []error { return m }

// UpdateUserInfoRequestValidationError is the validation error returned by
// UpdateUserInfoRequest.Validate if the designated constraints aren't met.
type UpdateUserInfoRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e UpdateUserInfoRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e UpdateUserInfoRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e UpdateUserInfoRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e UpdateUserInfoRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e UpdateUserInfoRequestValidationError) ErrorName() string {
	return "UpdateUserInfoRequestValidationError"
}

// Error satisfies the builtin error interface
func (e UpdateUserInfoRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sUpdateUserInfoRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = UpdateUserInfoRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = UpdateUserInfoRequestValidationError{}

// Validate checks the field values on UpdateUserInfoResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *UpdateUserInfoResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on UpdateUserInfoResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// UpdateUserInfoResponseMultiError, or nil if none found.
func (m *UpdateUserInfoResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *UpdateUserInfoResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return UpdateUserInfoResponseMultiError(errors)
	}

	return nil
}

// UpdateUserInfoResponseMultiError is an error wrapping multiple validation
// errors returned by UpdateUserInfoResponse.ValidateAll() if the designated
// constraints aren't met.
type UpdateUserInfoResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m UpdateUserInfoResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m UpdateUserInfoResponseMultiError) AllErrors() []error { return m }

// UpdateUserInfoResponseValidationError is the validation error returned by
// UpdateUserInfoResponse.Validate if the designated constraints aren't met.
type UpdateUserInfoResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e UpdateUserInfoResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e UpdateUserInfoResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e UpdateUserInfoResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e UpdateUserInfoResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e UpdateUserInfoResponseValidationError) ErrorName() string {
	return "UpdateUserInfoResponseValidationError"
}

// Error satisfies the builtin error interface
func (e UpdateUserInfoResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sUpdateUserInfoResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = UpdateUserInfoResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = UpdateUserInfoResponseValidationError{}

// Validate checks the field values on ChangePasswordRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *ChangePasswordRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on ChangePasswordRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// ChangePasswordRequestMultiError, or nil if none found.
func (m *ChangePasswordRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *ChangePasswordRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for OldPassword

	// no validation rules for NewPassword

	if len(errors) > 0 {
		return ChangePasswordRequestMultiError(errors)
	}

	return nil
}

// ChangePasswordRequestMultiError is an error wrapping multiple validation
// errors returned by ChangePasswordRequest.ValidateAll() if the designated
// constraints aren't met.
type ChangePasswordRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m ChangePasswordRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m ChangePasswordRequestMultiError) AllErrors() []error { return m }

// ChangePasswordRequestValidationError is the validation error returned by
// ChangePasswordRequest.Validate if the designated constraints aren't met.
type ChangePasswordRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e ChangePasswordRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e ChangePasswordRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e ChangePasswordRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e ChangePasswordRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e ChangePasswordRequestValidationError) ErrorName() string {
	return "ChangePasswordRequestValidationError"
}

// Error satisfies the builtin error interface
func (e ChangePasswordRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sChangePasswordRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = ChangePasswordRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = ChangePasswordRequestValidationError{}

// Validate checks the field values on ChangePasswordResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *ChangePasswordResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on ChangePasswordResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// ChangePasswordResponseMultiError, or nil if none found.
func (m *ChangePasswordResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *ChangePasswordResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return ChangePasswordResponseMultiError(errors)
	}

	return nil
}

// ChangePasswordResponseMultiError is an error wrapping multiple validation
// errors returned by ChangePasswordResponse.ValidateAll() if the designated
// constraints aren't met.
type ChangePasswordResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m ChangePasswordResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m ChangePasswordResponseMultiError) AllErrors() []error { return m }

// ChangePasswordResponseValidationError is the validation error returned by
// ChangePasswordResponse.Validate if the designated constraints aren't met.
type ChangePasswordResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e ChangePasswordResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e ChangePasswordResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e ChangePasswordResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e ChangePasswordResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e ChangePasswordResponseValidationError) ErrorName() string {
	return "ChangePasswordResponseValidationError"
}

// Error satisfies the builtin error interface
func (e ChangePasswordResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sChangePasswordResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = ChangePasswordResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = ChangePasswordResponseValidationError{}
