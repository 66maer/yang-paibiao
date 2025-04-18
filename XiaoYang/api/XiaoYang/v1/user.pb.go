// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.34.2
// 	protoc        v5.27.1
// source: api/XiaoYang/v1/user.proto

package v1

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

// 注册请求
type RegisterRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	QqNumber string `protobuf:"bytes,1,opt,name=qqNumber,proto3" json:"qqNumber"`
	Password string `protobuf:"bytes,2,opt,name=password,proto3" json:"password"`
	Nickname string `protobuf:"bytes,3,opt,name=nickname,proto3" json:"nickname"`
}

func (x *RegisterRequest) Reset() {
	*x = RegisterRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *RegisterRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*RegisterRequest) ProtoMessage() {}

func (x *RegisterRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use RegisterRequest.ProtoReflect.Descriptor instead.
func (*RegisterRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{0}
}

func (x *RegisterRequest) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *RegisterRequest) GetPassword() string {
	if x != nil {
		return x.Password
	}
	return ""
}

func (x *RegisterRequest) GetNickname() string {
	if x != nil {
		return x.Nickname
	}
	return ""
}

// 注册响应
type RegisterResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Token    string `protobuf:"bytes,1,opt,name=token,proto3" json:"token"`
	UserId   uint64 `protobuf:"varint,2,opt,name=userId,proto3" json:"userId"`
	QqNumber string `protobuf:"bytes,3,opt,name=qqNumber,proto3" json:"qqNumber"`
	Nickname string `protobuf:"bytes,4,opt,name=nickname,proto3" json:"nickname"`
	Avatar   string `protobuf:"bytes,5,opt,name=avatar,proto3" json:"avatar"`
}

func (x *RegisterResponse) Reset() {
	*x = RegisterResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *RegisterResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*RegisterResponse) ProtoMessage() {}

func (x *RegisterResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use RegisterResponse.ProtoReflect.Descriptor instead.
func (*RegisterResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{1}
}

func (x *RegisterResponse) GetToken() string {
	if x != nil {
		return x.Token
	}
	return ""
}

func (x *RegisterResponse) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

func (x *RegisterResponse) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *RegisterResponse) GetNickname() string {
	if x != nil {
		return x.Nickname
	}
	return ""
}

func (x *RegisterResponse) GetAvatar() string {
	if x != nil {
		return x.Avatar
	}
	return ""
}

// 登录请求
type LoginRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	QqNumber string `protobuf:"bytes,1,opt,name=qqNumber,proto3" json:"qqNumber"`
	Password string `protobuf:"bytes,2,opt,name=password,proto3" json:"password"`
}

func (x *LoginRequest) Reset() {
	*x = LoginRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *LoginRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*LoginRequest) ProtoMessage() {}

func (x *LoginRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use LoginRequest.ProtoReflect.Descriptor instead.
func (*LoginRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{2}
}

func (x *LoginRequest) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *LoginRequest) GetPassword() string {
	if x != nil {
		return x.Password
	}
	return ""
}

// 登录响应
type LoginResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Token    string `protobuf:"bytes,1,opt,name=token,proto3" json:"token"`
	UserId   uint64 `protobuf:"varint,2,opt,name=userId,proto3" json:"userId"`
	QqNumber string `protobuf:"bytes,3,opt,name=qqNumber,proto3" json:"qqNumber"`
	Nickname string `protobuf:"bytes,4,opt,name=nickname,proto3" json:"nickname"`
	Avatar   string `protobuf:"bytes,5,opt,name=avatar,proto3" json:"avatar"`
}

func (x *LoginResponse) Reset() {
	*x = LoginResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *LoginResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*LoginResponse) ProtoMessage() {}

func (x *LoginResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use LoginResponse.ProtoReflect.Descriptor instead.
func (*LoginResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{3}
}

func (x *LoginResponse) GetToken() string {
	if x != nil {
		return x.Token
	}
	return ""
}

func (x *LoginResponse) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

func (x *LoginResponse) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *LoginResponse) GetNickname() string {
	if x != nil {
		return x.Nickname
	}
	return ""
}

func (x *LoginResponse) GetAvatar() string {
	if x != nil {
		return x.Avatar
	}
	return ""
}

// 登出请求
type LogoutRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId uint64 `protobuf:"varint,1,opt,name=userId,proto3" json:"userId"`
}

func (x *LogoutRequest) Reset() {
	*x = LogoutRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *LogoutRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*LogoutRequest) ProtoMessage() {}

func (x *LogoutRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use LogoutRequest.ProtoReflect.Descriptor instead.
func (*LogoutRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{4}
}

func (x *LogoutRequest) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

// 登出响应
type LogoutResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *LogoutResponse) Reset() {
	*x = LogoutResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *LogoutResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*LogoutResponse) ProtoMessage() {}

func (x *LogoutResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use LogoutResponse.ProtoReflect.Descriptor instead.
func (*LogoutResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{5}
}

// 获取用户信息请求
type GetUserInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *GetUserInfoRequest) Reset() {
	*x = GetUserInfoRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetUserInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetUserInfoRequest) ProtoMessage() {}

func (x *GetUserInfoRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetUserInfoRequest.ProtoReflect.Descriptor instead.
func (*GetUserInfoRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{6}
}

// 获取用户信息响应
type GetUserInfoResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId   uint64 `protobuf:"varint,1,opt,name=userId,proto3" json:"userId"`
	QqNumber string `protobuf:"bytes,2,opt,name=qqNumber,proto3" json:"qqNumber"`
	Nickname string `protobuf:"bytes,3,opt,name=nickname,proto3" json:"nickname"`
	Avatar   string `protobuf:"bytes,4,opt,name=avatar,proto3" json:"avatar"`
	IsAdmin  bool   `protobuf:"varint,5,opt,name=isAdmin,proto3" json:"isAdmin"`
}

func (x *GetUserInfoResponse) Reset() {
	*x = GetUserInfoResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetUserInfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetUserInfoResponse) ProtoMessage() {}

func (x *GetUserInfoResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetUserInfoResponse.ProtoReflect.Descriptor instead.
func (*GetUserInfoResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{7}
}

func (x *GetUserInfoResponse) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

func (x *GetUserInfoResponse) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *GetUserInfoResponse) GetNickname() string {
	if x != nil {
		return x.Nickname
	}
	return ""
}

func (x *GetUserInfoResponse) GetAvatar() string {
	if x != nil {
		return x.Avatar
	}
	return ""
}

func (x *GetUserInfoResponse) GetIsAdmin() bool {
	if x != nil {
		return x.IsAdmin
	}
	return false
}

// 更新用户信息请求
type UpdateUserInfoRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId   uint64 `protobuf:"varint,1,opt,name=userId,proto3" json:"userId"`
	QqNumber string `protobuf:"bytes,2,opt,name=qqNumber,proto3" json:"qqNumber"`
	Nickname string `protobuf:"bytes,3,opt,name=nickname,proto3" json:"nickname"`
	Avatar   string `protobuf:"bytes,4,opt,name=avatar,proto3" json:"avatar"`
}

func (x *UpdateUserInfoRequest) Reset() {
	*x = UpdateUserInfoRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UpdateUserInfoRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateUserInfoRequest) ProtoMessage() {}

func (x *UpdateUserInfoRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateUserInfoRequest.ProtoReflect.Descriptor instead.
func (*UpdateUserInfoRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{8}
}

func (x *UpdateUserInfoRequest) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

func (x *UpdateUserInfoRequest) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *UpdateUserInfoRequest) GetNickname() string {
	if x != nil {
		return x.Nickname
	}
	return ""
}

func (x *UpdateUserInfoRequest) GetAvatar() string {
	if x != nil {
		return x.Avatar
	}
	return ""
}

// 更新用户信息响应
type UpdateUserInfoResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *UpdateUserInfoResponse) Reset() {
	*x = UpdateUserInfoResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[9]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UpdateUserInfoResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateUserInfoResponse) ProtoMessage() {}

func (x *UpdateUserInfoResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[9]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateUserInfoResponse.ProtoReflect.Descriptor instead.
func (*UpdateUserInfoResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{9}
}

// 修改密码请求
type ChangePasswordRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	UserId      uint64 `protobuf:"varint,1,opt,name=userId,proto3" json:"userId"`
	QqNumber    string `protobuf:"bytes,2,opt,name=qqNumber,proto3" json:"qqNumber"`
	OldPassword string `protobuf:"bytes,3,opt,name=oldPassword,proto3" json:"oldPassword"`
	NewPassword string `protobuf:"bytes,4,opt,name=newPassword,proto3" json:"newPassword"`
}

func (x *ChangePasswordRequest) Reset() {
	*x = ChangePasswordRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[10]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChangePasswordRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChangePasswordRequest) ProtoMessage() {}

func (x *ChangePasswordRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[10]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChangePasswordRequest.ProtoReflect.Descriptor instead.
func (*ChangePasswordRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{10}
}

func (x *ChangePasswordRequest) GetUserId() uint64 {
	if x != nil {
		return x.UserId
	}
	return 0
}

func (x *ChangePasswordRequest) GetQqNumber() string {
	if x != nil {
		return x.QqNumber
	}
	return ""
}

func (x *ChangePasswordRequest) GetOldPassword() string {
	if x != nil {
		return x.OldPassword
	}
	return ""
}

func (x *ChangePasswordRequest) GetNewPassword() string {
	if x != nil {
		return x.NewPassword
	}
	return ""
}

// 修改密码响应
type ChangePasswordResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *ChangePasswordResponse) Reset() {
	*x = ChangePasswordResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_user_proto_msgTypes[11]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ChangePasswordResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ChangePasswordResponse) ProtoMessage() {}

func (x *ChangePasswordResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_user_proto_msgTypes[11]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ChangePasswordResponse.ProtoReflect.Descriptor instead.
func (*ChangePasswordResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_user_proto_rawDescGZIP(), []int{11}
}

var File_api_XiaoYang_v1_user_proto protoreflect.FileDescriptor

var file_api_XiaoYang_v1_user_proto_rawDesc = []byte{
	0x0a, 0x1a, 0x61, 0x70, 0x69, 0x2f, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2f, 0x76,
	0x31, 0x2f, 0x75, 0x73, 0x65, 0x72, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x0f, 0x61, 0x70,
	0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x1a, 0x1c, 0x67,
	0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x61, 0x6e, 0x6e, 0x6f, 0x74, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x63, 0x2d, 0x67, 0x65, 0x6e, 0x2d, 0x6f, 0x70, 0x65, 0x6e, 0x61, 0x70, 0x69, 0x76,
	0x32, 0x2f, 0x6f, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2f, 0x61, 0x6e, 0x6e, 0x6f, 0x74, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x13, 0x74, 0x61, 0x67,
	0x67, 0x65, 0x72, 0x2f, 0x74, 0x61, 0x67, 0x67, 0x65, 0x72, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x1a, 0x17, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64,
	0x61, 0x74, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0x65, 0x0a, 0x0f, 0x52, 0x65, 0x67,
	0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x1a, 0x0a, 0x08,
	0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08,
	0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12, 0x1a, 0x0a, 0x08, 0x70, 0x61, 0x73, 0x73,
	0x77, 0x6f, 0x72, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x70, 0x61, 0x73, 0x73,
	0x77, 0x6f, 0x72, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65,
	0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65,
	0x22, 0x90, 0x01, 0x0a, 0x10, 0x52, 0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x73,
	0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x14, 0x0a, 0x05, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x12, 0x16, 0x0a, 0x06, 0x75,
	0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x06, 0x75, 0x73, 0x65,
	0x72, 0x49, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12,
	0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x04, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x61,
	0x76, 0x61, 0x74, 0x61, 0x72, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x61, 0x76, 0x61,
	0x74, 0x61, 0x72, 0x22, 0x46, 0x0a, 0x0c, 0x4c, 0x6f, 0x67, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x1a, 0x0a, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12,
	0x1a, 0x0a, 0x08, 0x70, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x08, 0x70, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64, 0x22, 0x8d, 0x01, 0x0a, 0x0d,
	0x4c, 0x6f, 0x67, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x14, 0x0a,
	0x05, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x74, 0x6f,
	0x6b, 0x65, 0x6e, 0x12, 0x16, 0x0a, 0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x02, 0x20,
	0x01, 0x28, 0x04, 0x52, 0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x71,
	0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x71,
	0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12, 0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e,
	0x61, 0x6d, 0x65, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e,
	0x61, 0x6d, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x18, 0x05, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x22, 0x27, 0x0a, 0x0d, 0x4c,
	0x6f, 0x67, 0x6f, 0x75, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06,
	0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x06, 0x75, 0x73,
	0x65, 0x72, 0x49, 0x64, 0x22, 0x10, 0x0a, 0x0e, 0x4c, 0x6f, 0x67, 0x6f, 0x75, 0x74, 0x52, 0x65,
	0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x14, 0x0a, 0x12, 0x47, 0x65, 0x74, 0x55, 0x73, 0x65,
	0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x97, 0x01, 0x0a,
	0x13, 0x47, 0x65, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x04, 0x52, 0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12, 0x1a, 0x0a, 0x08,
	0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08,
	0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12, 0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63, 0x6b,
	0x6e, 0x61, 0x6d, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6e, 0x69, 0x63, 0x6b,
	0x6e, 0x61, 0x6d, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x18, 0x04,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x12, 0x18, 0x0a, 0x07,
	0x69, 0x73, 0x41, 0x64, 0x6d, 0x69, 0x6e, 0x18, 0x05, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x69,
	0x73, 0x41, 0x64, 0x6d, 0x69, 0x6e, 0x22, 0x7f, 0x0a, 0x15, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65,
	0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12,
	0x16, 0x0a, 0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52,
	0x06, 0x75, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d,
	0x62, 0x65, 0x72, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d,
	0x62, 0x65, 0x72, 0x12, 0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6e, 0x69, 0x63, 0x6b, 0x6e, 0x61, 0x6d, 0x65, 0x12,
	0x16, 0x0a, 0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x06, 0x61, 0x76, 0x61, 0x74, 0x61, 0x72, 0x22, 0x18, 0x0a, 0x16, 0x55, 0x70, 0x64, 0x61, 0x74,
	0x65, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x22, 0x8f, 0x01, 0x0a, 0x15, 0x43, 0x68, 0x61, 0x6e, 0x67, 0x65, 0x50, 0x61, 0x73, 0x73,
	0x77, 0x6f, 0x72, 0x64, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x75,
	0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x06, 0x75, 0x73, 0x65,
	0x72, 0x49, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x71, 0x71, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12,
	0x20, 0x0a, 0x0b, 0x6f, 0x6c, 0x64, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64, 0x18, 0x03,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x0b, 0x6f, 0x6c, 0x64, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72,
	0x64, 0x12, 0x20, 0x0a, 0x0b, 0x6e, 0x65, 0x77, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64,
	0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0b, 0x6e, 0x65, 0x77, 0x50, 0x61, 0x73, 0x73, 0x77,
	0x6f, 0x72, 0x64, 0x22, 0x18, 0x0a, 0x16, 0x43, 0x68, 0x61, 0x6e, 0x67, 0x65, 0x50, 0x61, 0x73,
	0x73, 0x77, 0x6f, 0x72, 0x64, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x32, 0xd0, 0x07,
	0x0a, 0x0b, 0x55, 0x73, 0x65, 0x72, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x84, 0x01,
	0x0a, 0x08, 0x52, 0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x12, 0x20, 0x2e, 0x61, 0x70, 0x69,
	0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x52, 0x65, 0x67,
	0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x21, 0x2e, 0x61,
	0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x52,
	0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22,
	0x33, 0x92, 0x41, 0x10, 0x12, 0x06, 0xe6, 0xb3, 0xa8, 0xe5, 0x86, 0x8c, 0x1a, 0x06, 0xe6, 0xb3,
	0xa8, 0xe5, 0x86, 0x8c, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x1a, 0x3a, 0x01, 0x2a, 0x22, 0x15, 0x2f,
	0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x61, 0x75, 0x74, 0x68, 0x2f, 0x72, 0x65, 0x67, 0x69,
	0x73, 0x74, 0x65, 0x72, 0x12, 0x78, 0x0a, 0x05, 0x4c, 0x6f, 0x67, 0x69, 0x6e, 0x12, 0x1d, 0x2e,
	0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e,
	0x4c, 0x6f, 0x67, 0x69, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1e, 0x2e, 0x61,
	0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x4c,
	0x6f, 0x67, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x30, 0x92, 0x41,
	0x10, 0x12, 0x06, 0xe7, 0x99, 0xbb, 0xe5, 0xbd, 0x95, 0x1a, 0x06, 0xe7, 0x99, 0xbb, 0xe5, 0xbd,
	0x95, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x17, 0x3a, 0x01, 0x2a, 0x22, 0x12, 0x2f, 0x61, 0x70, 0x69,
	0x2f, 0x76, 0x31, 0x2f, 0x61, 0x75, 0x74, 0x68, 0x2f, 0x6c, 0x6f, 0x67, 0x69, 0x6e, 0x12, 0x8e,
	0x01, 0x0a, 0x06, 0x4c, 0x6f, 0x67, 0x6f, 0x75, 0x74, 0x12, 0x1e, 0x2e, 0x61, 0x70, 0x69, 0x2e,
	0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x4c, 0x6f, 0x67, 0x6f,
	0x75, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1f, 0x2e, 0x61, 0x70, 0x69, 0x2e,
	0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x4c, 0x6f, 0x67, 0x6f,
	0x75, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x43, 0x92, 0x41, 0x22, 0x12,
	0x06, 0xe7, 0x99, 0xbb, 0xe5, 0x87, 0xba, 0x1a, 0x06, 0xe7, 0x99, 0xbb, 0xe5, 0x87, 0xba, 0x62,
	0x10, 0x0a, 0x0e, 0x0a, 0x0a, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12,
	0x00, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x18, 0x3a, 0x01, 0x2a, 0x22, 0x13, 0x2f, 0x61, 0x70, 0x69,
	0x2f, 0x76, 0x31, 0x2f, 0x61, 0x75, 0x74, 0x68, 0x2f, 0x6c, 0x6f, 0x67, 0x6f, 0x75, 0x74, 0x12,
	0xba, 0x01, 0x0a, 0x0b, 0x47, 0x65, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x12,
	0x23, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76,
	0x31, 0x2e, 0x47, 0x65, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x1a, 0x24, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59,
	0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x47, 0x65, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e,
	0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x60, 0x92, 0x41, 0x3a, 0x12,
	0x12, 0xe8, 0x8e, 0xb7, 0xe5, 0x8f, 0x96, 0xe7, 0x94, 0xa8, 0xe6, 0x88, 0xb7, 0xe4, 0xbf, 0xa1,
	0xe6, 0x81, 0xaf, 0x1a, 0x12, 0xe8, 0x8e, 0xb7, 0xe5, 0x8f, 0x96, 0xe7, 0x94, 0xa8, 0xe6, 0x88,
	0xb7, 0xe4, 0xbf, 0xa1, 0xe6, 0x81, 0xaf, 0x62, 0x10, 0x0a, 0x0e, 0x0a, 0x0a, 0x42, 0x65, 0x61,
	0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12, 0x00, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x1d, 0x3a,
	0x01, 0x2a, 0x22, 0x18, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x75, 0x73, 0x65, 0x72,
	0x2f, 0x67, 0x65, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0xc6, 0x01, 0x0a,
	0x0e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x12,
	0x26, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76,
	0x31, 0x2e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x27, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69,
	0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65,
	0x55, 0x73, 0x65, 0x72, 0x49, 0x6e, 0x66, 0x6f, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x22, 0x63, 0x92, 0x41, 0x3a, 0x12, 0x12, 0xe6, 0x9b, 0xb4, 0xe6, 0x96, 0xb0, 0xe7, 0x94, 0xa8,
	0xe6, 0x88, 0xb7, 0xe4, 0xbf, 0xa1, 0xe6, 0x81, 0xaf, 0x1a, 0x12, 0xe6, 0x9b, 0xb4, 0xe6, 0x96,
	0xb0, 0xe7, 0x94, 0xa8, 0xe6, 0x88, 0xb7, 0xe4, 0xbf, 0xa1, 0xe6, 0x81, 0xaf, 0x62, 0x10, 0x0a,
	0x0e, 0x0a, 0x0a, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12, 0x00, 0x82,
	0xd3, 0xe4, 0x93, 0x02, 0x20, 0x3a, 0x01, 0x2a, 0x22, 0x1b, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76,
	0x31, 0x2f, 0x75, 0x73, 0x65, 0x72, 0x2f, 0x75, 0x70, 0x64, 0x61, 0x74, 0x65, 0x55, 0x73, 0x65,
	0x72, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0xa8, 0x01, 0x0a, 0x0e, 0x43, 0x68, 0x61, 0x6e, 0x67, 0x65,
	0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64, 0x12, 0x26, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58,
	0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x68, 0x61, 0x6e, 0x67,
	0x65, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74,
	0x1a, 0x27, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e,
	0x76, 0x31, 0x2e, 0x43, 0x68, 0x61, 0x6e, 0x67, 0x65, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72,
	0x64, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x45, 0x92, 0x41, 0x1c, 0x12, 0x0c,
	0xe4, 0xbf, 0xae, 0xe6, 0x94, 0xb9, 0xe5, 0xaf, 0x86, 0xe7, 0xa0, 0x81, 0x1a, 0x0c, 0xe4, 0xbf,
	0xae, 0xe6, 0x94, 0xb9, 0xe5, 0xaf, 0x86, 0xe7, 0xa0, 0x81, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x20,
	0x3a, 0x01, 0x2a, 0x22, 0x1b, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x75, 0x73, 0x65,
	0x72, 0x2f, 0x63, 0x68, 0x61, 0x6e, 0x67, 0x65, 0x50, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64,
	0x42, 0xc2, 0x01, 0x92, 0x41, 0xa1, 0x01, 0x12, 0x18, 0x0a, 0x11, 0x78, 0x69, 0x61, 0x6f, 0x79,
	0x61, 0x6e, 0x67, 0x20, 0x61, 0x70, 0x69, 0x20, 0x64, 0x6f, 0x63, 0x73, 0x32, 0x03, 0x32, 0x2e,
	0x30, 0x1a, 0x0e, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x68, 0x6f, 0x73, 0x74, 0x3a, 0x38, 0x30, 0x38,
	0x30, 0x2a, 0x02, 0x01, 0x02, 0x32, 0x10, 0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69,
	0x6f, 0x6e, 0x2f, 0x6a, 0x73, 0x6f, 0x6e, 0x3a, 0x10, 0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6a, 0x73, 0x6f, 0x6e, 0x5a, 0x4d, 0x0a, 0x4b, 0x0a, 0x0a, 0x42,
	0x65, 0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12, 0x3d, 0x08, 0x02, 0x12, 0x28, 0x49,
	0x6e, 0x70, 0x75, 0x74, 0x20, 0x61, 0x20, 0x22, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x20, 0x79,
	0x6f, 0x75, 0x72, 0x2d, 0x6a, 0x77, 0x74, 0x2d, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x22, 0x20, 0x74,
	0x6f, 0x20, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x1a, 0x0d, 0x41, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x69,
	0x7a, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x02, 0x5a, 0x1b, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61,
	0x6e, 0x67, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2f,
	0x76, 0x31, 0x3b, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_api_XiaoYang_v1_user_proto_rawDescOnce sync.Once
	file_api_XiaoYang_v1_user_proto_rawDescData = file_api_XiaoYang_v1_user_proto_rawDesc
)

func file_api_XiaoYang_v1_user_proto_rawDescGZIP() []byte {
	file_api_XiaoYang_v1_user_proto_rawDescOnce.Do(func() {
		file_api_XiaoYang_v1_user_proto_rawDescData = protoimpl.X.CompressGZIP(file_api_XiaoYang_v1_user_proto_rawDescData)
	})
	return file_api_XiaoYang_v1_user_proto_rawDescData
}

var file_api_XiaoYang_v1_user_proto_msgTypes = make([]protoimpl.MessageInfo, 12)
var file_api_XiaoYang_v1_user_proto_goTypes = []any{
	(*RegisterRequest)(nil),        // 0: api.XiaoYang.v1.RegisterRequest
	(*RegisterResponse)(nil),       // 1: api.XiaoYang.v1.RegisterResponse
	(*LoginRequest)(nil),           // 2: api.XiaoYang.v1.LoginRequest
	(*LoginResponse)(nil),          // 3: api.XiaoYang.v1.LoginResponse
	(*LogoutRequest)(nil),          // 4: api.XiaoYang.v1.LogoutRequest
	(*LogoutResponse)(nil),         // 5: api.XiaoYang.v1.LogoutResponse
	(*GetUserInfoRequest)(nil),     // 6: api.XiaoYang.v1.GetUserInfoRequest
	(*GetUserInfoResponse)(nil),    // 7: api.XiaoYang.v1.GetUserInfoResponse
	(*UpdateUserInfoRequest)(nil),  // 8: api.XiaoYang.v1.UpdateUserInfoRequest
	(*UpdateUserInfoResponse)(nil), // 9: api.XiaoYang.v1.UpdateUserInfoResponse
	(*ChangePasswordRequest)(nil),  // 10: api.XiaoYang.v1.ChangePasswordRequest
	(*ChangePasswordResponse)(nil), // 11: api.XiaoYang.v1.ChangePasswordResponse
}
var file_api_XiaoYang_v1_user_proto_depIdxs = []int32{
	0,  // 0: api.XiaoYang.v1.UserService.Register:input_type -> api.XiaoYang.v1.RegisterRequest
	2,  // 1: api.XiaoYang.v1.UserService.Login:input_type -> api.XiaoYang.v1.LoginRequest
	4,  // 2: api.XiaoYang.v1.UserService.Logout:input_type -> api.XiaoYang.v1.LogoutRequest
	6,  // 3: api.XiaoYang.v1.UserService.GetUserInfo:input_type -> api.XiaoYang.v1.GetUserInfoRequest
	8,  // 4: api.XiaoYang.v1.UserService.UpdateUserInfo:input_type -> api.XiaoYang.v1.UpdateUserInfoRequest
	10, // 5: api.XiaoYang.v1.UserService.ChangePassword:input_type -> api.XiaoYang.v1.ChangePasswordRequest
	1,  // 6: api.XiaoYang.v1.UserService.Register:output_type -> api.XiaoYang.v1.RegisterResponse
	3,  // 7: api.XiaoYang.v1.UserService.Login:output_type -> api.XiaoYang.v1.LoginResponse
	5,  // 8: api.XiaoYang.v1.UserService.Logout:output_type -> api.XiaoYang.v1.LogoutResponse
	7,  // 9: api.XiaoYang.v1.UserService.GetUserInfo:output_type -> api.XiaoYang.v1.GetUserInfoResponse
	9,  // 10: api.XiaoYang.v1.UserService.UpdateUserInfo:output_type -> api.XiaoYang.v1.UpdateUserInfoResponse
	11, // 11: api.XiaoYang.v1.UserService.ChangePassword:output_type -> api.XiaoYang.v1.ChangePasswordResponse
	6,  // [6:12] is the sub-list for method output_type
	0,  // [0:6] is the sub-list for method input_type
	0,  // [0:0] is the sub-list for extension type_name
	0,  // [0:0] is the sub-list for extension extendee
	0,  // [0:0] is the sub-list for field type_name
}

func init() { file_api_XiaoYang_v1_user_proto_init() }
func file_api_XiaoYang_v1_user_proto_init() {
	if File_api_XiaoYang_v1_user_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_api_XiaoYang_v1_user_proto_msgTypes[0].Exporter = func(v any, i int) any {
			switch v := v.(*RegisterRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[1].Exporter = func(v any, i int) any {
			switch v := v.(*RegisterResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[2].Exporter = func(v any, i int) any {
			switch v := v.(*LoginRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[3].Exporter = func(v any, i int) any {
			switch v := v.(*LoginResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[4].Exporter = func(v any, i int) any {
			switch v := v.(*LogoutRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[5].Exporter = func(v any, i int) any {
			switch v := v.(*LogoutResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[6].Exporter = func(v any, i int) any {
			switch v := v.(*GetUserInfoRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[7].Exporter = func(v any, i int) any {
			switch v := v.(*GetUserInfoResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[8].Exporter = func(v any, i int) any {
			switch v := v.(*UpdateUserInfoRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[9].Exporter = func(v any, i int) any {
			switch v := v.(*UpdateUserInfoResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[10].Exporter = func(v any, i int) any {
			switch v := v.(*ChangePasswordRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_XiaoYang_v1_user_proto_msgTypes[11].Exporter = func(v any, i int) any {
			switch v := v.(*ChangePasswordResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_api_XiaoYang_v1_user_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   12,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_api_XiaoYang_v1_user_proto_goTypes,
		DependencyIndexes: file_api_XiaoYang_v1_user_proto_depIdxs,
		MessageInfos:      file_api_XiaoYang_v1_user_proto_msgTypes,
	}.Build()
	File_api_XiaoYang_v1_user_proto = out.File
	file_api_XiaoYang_v1_user_proto_rawDesc = nil
	file_api_XiaoYang_v1_user_proto_goTypes = nil
	file_api_XiaoYang_v1_user_proto_depIdxs = nil
}
