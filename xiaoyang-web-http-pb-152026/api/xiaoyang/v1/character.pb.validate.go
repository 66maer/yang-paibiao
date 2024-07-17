// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: api/xiaoyang/v1/character.proto

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

// Validate checks the field values on CharacterInfo with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *CharacterInfo) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on CharacterInfo with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in CharacterInfoMultiError, or
// nil if none found.
func (m *CharacterInfo) ValidateAll() error {
	return m.validate(true)
}

func (m *CharacterInfo) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Id

	// no validation rules for UserId

	// no validation rules for QqNumber

	// no validation rules for Name

	// no validation rules for Server

	// no validation rules for Xinfa

	// no validation rules for Remark

	if len(errors) > 0 {
		return CharacterInfoMultiError(errors)
	}

	return nil
}

// CharacterInfoMultiError is an error wrapping multiple validation errors
// returned by CharacterInfo.ValidateAll() if the designated constraints
// aren't met.
type CharacterInfoMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m CharacterInfoMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m CharacterInfoMultiError) AllErrors() []error { return m }

// CharacterInfoValidationError is the validation error returned by
// CharacterInfo.Validate if the designated constraints aren't met.
type CharacterInfoValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e CharacterInfoValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e CharacterInfoValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e CharacterInfoValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e CharacterInfoValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e CharacterInfoValidationError) ErrorName() string { return "CharacterInfoValidationError" }

// Error satisfies the builtin error interface
func (e CharacterInfoValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sCharacterInfo.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = CharacterInfoValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = CharacterInfoValidationError{}

// Validate checks the field values on CreateCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *CreateCharacterRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on CreateCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// CreateCharacterRequestMultiError, or nil if none found.
func (m *CreateCharacterRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *CreateCharacterRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if all {
		switch v := interface{}(m.GetCharacter()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, CreateCharacterRequestValidationError{
					field:  "Character",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, CreateCharacterRequestValidationError{
					field:  "Character",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetCharacter()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return CreateCharacterRequestValidationError{
				field:  "Character",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	if len(errors) > 0 {
		return CreateCharacterRequestMultiError(errors)
	}

	return nil
}

// CreateCharacterRequestMultiError is an error wrapping multiple validation
// errors returned by CreateCharacterRequest.ValidateAll() if the designated
// constraints aren't met.
type CreateCharacterRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m CreateCharacterRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m CreateCharacterRequestMultiError) AllErrors() []error { return m }

// CreateCharacterRequestValidationError is the validation error returned by
// CreateCharacterRequest.Validate if the designated constraints aren't met.
type CreateCharacterRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e CreateCharacterRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e CreateCharacterRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e CreateCharacterRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e CreateCharacterRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e CreateCharacterRequestValidationError) ErrorName() string {
	return "CreateCharacterRequestValidationError"
}

// Error satisfies the builtin error interface
func (e CreateCharacterRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sCreateCharacterRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = CreateCharacterRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = CreateCharacterRequestValidationError{}

// Validate checks the field values on CreateCharacterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *CreateCharacterResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on CreateCharacterResponse with the
// rules defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// CreateCharacterResponseMultiError, or nil if none found.
func (m *CreateCharacterResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *CreateCharacterResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Id

	if len(errors) > 0 {
		return CreateCharacterResponseMultiError(errors)
	}

	return nil
}

// CreateCharacterResponseMultiError is an error wrapping multiple validation
// errors returned by CreateCharacterResponse.ValidateAll() if the designated
// constraints aren't met.
type CreateCharacterResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m CreateCharacterResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m CreateCharacterResponseMultiError) AllErrors() []error { return m }

// CreateCharacterResponseValidationError is the validation error returned by
// CreateCharacterResponse.Validate if the designated constraints aren't met.
type CreateCharacterResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e CreateCharacterResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e CreateCharacterResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e CreateCharacterResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e CreateCharacterResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e CreateCharacterResponseValidationError) ErrorName() string {
	return "CreateCharacterResponseValidationError"
}

// Error satisfies the builtin error interface
func (e CreateCharacterResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sCreateCharacterResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = CreateCharacterResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = CreateCharacterResponseValidationError{}

// Validate checks the field values on ListCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *ListCharacterRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on ListCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// ListCharacterRequestMultiError, or nil if none found.
func (m *ListCharacterRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *ListCharacterRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for UserId

	// no validation rules for QqNumber

	if len(errors) > 0 {
		return ListCharacterRequestMultiError(errors)
	}

	return nil
}

// ListCharacterRequestMultiError is an error wrapping multiple validation
// errors returned by ListCharacterRequest.ValidateAll() if the designated
// constraints aren't met.
type ListCharacterRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m ListCharacterRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m ListCharacterRequestMultiError) AllErrors() []error { return m }

// ListCharacterRequestValidationError is the validation error returned by
// ListCharacterRequest.Validate if the designated constraints aren't met.
type ListCharacterRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e ListCharacterRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e ListCharacterRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e ListCharacterRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e ListCharacterRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e ListCharacterRequestValidationError) ErrorName() string {
	return "ListCharacterRequestValidationError"
}

// Error satisfies the builtin error interface
func (e ListCharacterRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sListCharacterRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = ListCharacterRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = ListCharacterRequestValidationError{}

// Validate checks the field values on ListCharacterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *ListCharacterResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on ListCharacterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// ListCharacterResponseMultiError, or nil if none found.
func (m *ListCharacterResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *ListCharacterResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	for idx, item := range m.GetCharacterList() {
		_, _ = idx, item

		if all {
			switch v := interface{}(item).(type) {
			case interface{ ValidateAll() error }:
				if err := v.ValidateAll(); err != nil {
					errors = append(errors, ListCharacterResponseValidationError{
						field:  fmt.Sprintf("CharacterList[%v]", idx),
						reason: "embedded message failed validation",
						cause:  err,
					})
				}
			case interface{ Validate() error }:
				if err := v.Validate(); err != nil {
					errors = append(errors, ListCharacterResponseValidationError{
						field:  fmt.Sprintf("CharacterList[%v]", idx),
						reason: "embedded message failed validation",
						cause:  err,
					})
				}
			}
		} else if v, ok := interface{}(item).(interface{ Validate() error }); ok {
			if err := v.Validate(); err != nil {
				return ListCharacterResponseValidationError{
					field:  fmt.Sprintf("CharacterList[%v]", idx),
					reason: "embedded message failed validation",
					cause:  err,
				}
			}
		}

	}

	if len(errors) > 0 {
		return ListCharacterResponseMultiError(errors)
	}

	return nil
}

// ListCharacterResponseMultiError is an error wrapping multiple validation
// errors returned by ListCharacterResponse.ValidateAll() if the designated
// constraints aren't met.
type ListCharacterResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m ListCharacterResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m ListCharacterResponseMultiError) AllErrors() []error { return m }

// ListCharacterResponseValidationError is the validation error returned by
// ListCharacterResponse.Validate if the designated constraints aren't met.
type ListCharacterResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e ListCharacterResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e ListCharacterResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e ListCharacterResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e ListCharacterResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e ListCharacterResponseValidationError) ErrorName() string {
	return "ListCharacterResponseValidationError"
}

// Error satisfies the builtin error interface
func (e ListCharacterResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sListCharacterResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = ListCharacterResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = ListCharacterResponseValidationError{}

// Validate checks the field values on DeleteCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *DeleteCharacterRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on DeleteCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// DeleteCharacterRequestMultiError, or nil if none found.
func (m *DeleteCharacterRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *DeleteCharacterRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Id

	if len(errors) > 0 {
		return DeleteCharacterRequestMultiError(errors)
	}

	return nil
}

// DeleteCharacterRequestMultiError is an error wrapping multiple validation
// errors returned by DeleteCharacterRequest.ValidateAll() if the designated
// constraints aren't met.
type DeleteCharacterRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m DeleteCharacterRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m DeleteCharacterRequestMultiError) AllErrors() []error { return m }

// DeleteCharacterRequestValidationError is the validation error returned by
// DeleteCharacterRequest.Validate if the designated constraints aren't met.
type DeleteCharacterRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e DeleteCharacterRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e DeleteCharacterRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e DeleteCharacterRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e DeleteCharacterRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e DeleteCharacterRequestValidationError) ErrorName() string {
	return "DeleteCharacterRequestValidationError"
}

// Error satisfies the builtin error interface
func (e DeleteCharacterRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sDeleteCharacterRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = DeleteCharacterRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = DeleteCharacterRequestValidationError{}

// Validate checks the field values on DeleteCharacterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *DeleteCharacterResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on DeleteCharacterResponse with the
// rules defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// DeleteCharacterResponseMultiError, or nil if none found.
func (m *DeleteCharacterResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *DeleteCharacterResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return DeleteCharacterResponseMultiError(errors)
	}

	return nil
}

// DeleteCharacterResponseMultiError is an error wrapping multiple validation
// errors returned by DeleteCharacterResponse.ValidateAll() if the designated
// constraints aren't met.
type DeleteCharacterResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m DeleteCharacterResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m DeleteCharacterResponseMultiError) AllErrors() []error { return m }

// DeleteCharacterResponseValidationError is the validation error returned by
// DeleteCharacterResponse.Validate if the designated constraints aren't met.
type DeleteCharacterResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e DeleteCharacterResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e DeleteCharacterResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e DeleteCharacterResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e DeleteCharacterResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e DeleteCharacterResponseValidationError) ErrorName() string {
	return "DeleteCharacterResponseValidationError"
}

// Error satisfies the builtin error interface
func (e DeleteCharacterResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sDeleteCharacterResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = DeleteCharacterResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = DeleteCharacterResponseValidationError{}

// Validate checks the field values on UpdateCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *UpdateCharacterRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on UpdateCharacterRequest with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// UpdateCharacterRequestMultiError, or nil if none found.
func (m *UpdateCharacterRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *UpdateCharacterRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Id

	if all {
		switch v := interface{}(m.GetCharacter()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, UpdateCharacterRequestValidationError{
					field:  "Character",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, UpdateCharacterRequestValidationError{
					field:  "Character",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetCharacter()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return UpdateCharacterRequestValidationError{
				field:  "Character",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	if len(errors) > 0 {
		return UpdateCharacterRequestMultiError(errors)
	}

	return nil
}

// UpdateCharacterRequestMultiError is an error wrapping multiple validation
// errors returned by UpdateCharacterRequest.ValidateAll() if the designated
// constraints aren't met.
type UpdateCharacterRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m UpdateCharacterRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m UpdateCharacterRequestMultiError) AllErrors() []error { return m }

// UpdateCharacterRequestValidationError is the validation error returned by
// UpdateCharacterRequest.Validate if the designated constraints aren't met.
type UpdateCharacterRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e UpdateCharacterRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e UpdateCharacterRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e UpdateCharacterRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e UpdateCharacterRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e UpdateCharacterRequestValidationError) ErrorName() string {
	return "UpdateCharacterRequestValidationError"
}

// Error satisfies the builtin error interface
func (e UpdateCharacterRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sUpdateCharacterRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = UpdateCharacterRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = UpdateCharacterRequestValidationError{}

// Validate checks the field values on UpdateCharacterResponse with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *UpdateCharacterResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on UpdateCharacterResponse with the
// rules defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// UpdateCharacterResponseMultiError, or nil if none found.
func (m *UpdateCharacterResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *UpdateCharacterResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if len(errors) > 0 {
		return UpdateCharacterResponseMultiError(errors)
	}

	return nil
}

// UpdateCharacterResponseMultiError is an error wrapping multiple validation
// errors returned by UpdateCharacterResponse.ValidateAll() if the designated
// constraints aren't met.
type UpdateCharacterResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m UpdateCharacterResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m UpdateCharacterResponseMultiError) AllErrors() []error { return m }

// UpdateCharacterResponseValidationError is the validation error returned by
// UpdateCharacterResponse.Validate if the designated constraints aren't met.
type UpdateCharacterResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e UpdateCharacterResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e UpdateCharacterResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e UpdateCharacterResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e UpdateCharacterResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e UpdateCharacterResponseValidationError) ErrorName() string {
	return "UpdateCharacterResponseValidationError"
}

// Error satisfies the builtin error interface
func (e UpdateCharacterResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sUpdateCharacterResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = UpdateCharacterResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = UpdateCharacterResponseValidationError{}
