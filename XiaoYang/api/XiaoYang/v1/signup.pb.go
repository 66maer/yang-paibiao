// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.34.2
// 	protoc        v5.27.1
// source: api/XiaoYang/v1/signup.proto

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

// 报名请求
type CreateSignupRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TeamId            uint64 `protobuf:"varint,1,opt,name=teamId,proto3" json:"teamId"`
	SubmitUserId      uint64 `protobuf:"varint,2,opt,name=submitUserId,proto3" json:"submitUserId"`
	SignupUserId      uint64 `protobuf:"varint,3,opt,name=signupUserId,proto3" json:"signupUserId"`
	SignupCharacterId uint64 `protobuf:"varint,4,opt,name=signupCharacterId,proto3" json:"signupCharacterId"`
	SignupInfo        string `protobuf:"bytes,5,opt,name=signupInfo,proto3" json:"signupInfo"` // 报名展示信息
	Priority          int32  `protobuf:"varint,6,opt,name=priority,proto3" json:"priority"`
	IsRich            bool   `protobuf:"varint,7,opt,name=isRich,proto3" json:"isRich"`
	IsProxy           bool   `protobuf:"varint,8,opt,name=isProxy,proto3" json:"isProxy"`
	ClientType        string `protobuf:"bytes,9,opt,name=clientType,proto3" json:"clientType"`
	LockSlot          int32  `protobuf:"varint,10,opt,name=lockSlot,proto3" json:"lockSlot"`
}

func (x *CreateSignupRequest) Reset() {
	*x = CreateSignupRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CreateSignupRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateSignupRequest) ProtoMessage() {}

func (x *CreateSignupRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateSignupRequest.ProtoReflect.Descriptor instead.
func (*CreateSignupRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{0}
}

func (x *CreateSignupRequest) GetTeamId() uint64 {
	if x != nil {
		return x.TeamId
	}
	return 0
}

func (x *CreateSignupRequest) GetSubmitUserId() uint64 {
	if x != nil {
		return x.SubmitUserId
	}
	return 0
}

func (x *CreateSignupRequest) GetSignupUserId() uint64 {
	if x != nil {
		return x.SignupUserId
	}
	return 0
}

func (x *CreateSignupRequest) GetSignupCharacterId() uint64 {
	if x != nil {
		return x.SignupCharacterId
	}
	return 0
}

func (x *CreateSignupRequest) GetSignupInfo() string {
	if x != nil {
		return x.SignupInfo
	}
	return ""
}

func (x *CreateSignupRequest) GetPriority() int32 {
	if x != nil {
		return x.Priority
	}
	return 0
}

func (x *CreateSignupRequest) GetIsRich() bool {
	if x != nil {
		return x.IsRich
	}
	return false
}

func (x *CreateSignupRequest) GetIsProxy() bool {
	if x != nil {
		return x.IsProxy
	}
	return false
}

func (x *CreateSignupRequest) GetClientType() string {
	if x != nil {
		return x.ClientType
	}
	return ""
}

func (x *CreateSignupRequest) GetLockSlot() int32 {
	if x != nil {
		return x.LockSlot
	}
	return 0
}

// 报名响应
type CreateSignupResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success bool `protobuf:"varint,1,opt,name=success,proto3" json:"success"`
}

func (x *CreateSignupResponse) Reset() {
	*x = CreateSignupResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CreateSignupResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateSignupResponse) ProtoMessage() {}

func (x *CreateSignupResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateSignupResponse.ProtoReflect.Descriptor instead.
func (*CreateSignupResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{1}
}

func (x *CreateSignupResponse) GetSuccess() bool {
	if x != nil {
		return x.Success
	}
	return false
}

// 取消报名请求
type CancelSignupRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	SignupId     uint64 `protobuf:"varint,1,opt,name=signupId,proto3" json:"signupId"`
	CancelUserId uint64 `protobuf:"varint,2,opt,name=cancelUserId,proto3" json:"cancelUserId"`
}

func (x *CancelSignupRequest) Reset() {
	*x = CancelSignupRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CancelSignupRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CancelSignupRequest) ProtoMessage() {}

func (x *CancelSignupRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CancelSignupRequest.ProtoReflect.Descriptor instead.
func (*CancelSignupRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{2}
}

func (x *CancelSignupRequest) GetSignupId() uint64 {
	if x != nil {
		return x.SignupId
	}
	return 0
}

func (x *CancelSignupRequest) GetCancelUserId() uint64 {
	if x != nil {
		return x.CancelUserId
	}
	return 0
}

// 取消报名响应
type CancelSignupResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success bool `protobuf:"varint,1,opt,name=success,proto3" json:"success"`
}

func (x *CancelSignupResponse) Reset() {
	*x = CancelSignupResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CancelSignupResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CancelSignupResponse) ProtoMessage() {}

func (x *CancelSignupResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CancelSignupResponse.ProtoReflect.Descriptor instead.
func (*CancelSignupResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{3}
}

func (x *CancelSignupResponse) GetSuccess() bool {
	if x != nil {
		return x.Success
	}
	return false
}

// 获取报名信息请求
type GetSignupsByTeamRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TeamId uint64 `protobuf:"varint,1,opt,name=teamId,proto3" json:"teamId"`
}

func (x *GetSignupsByTeamRequest) Reset() {
	*x = GetSignupsByTeamRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetSignupsByTeamRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetSignupsByTeamRequest) ProtoMessage() {}

func (x *GetSignupsByTeamRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetSignupsByTeamRequest.ProtoReflect.Descriptor instead.
func (*GetSignupsByTeamRequest) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{4}
}

func (x *GetSignupsByTeamRequest) GetTeamId() uint64 {
	if x != nil {
		return x.TeamId
	}
	return 0
}

// 获取报名信息响应
type GetSignupsByTeamResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Signups []*SignupInfo `protobuf:"bytes,1,rep,name=signups,proto3" json:"signups"`
}

func (x *GetSignupsByTeamResponse) Reset() {
	*x = GetSignupsByTeamResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetSignupsByTeamResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetSignupsByTeamResponse) ProtoMessage() {}

func (x *GetSignupsByTeamResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetSignupsByTeamResponse.ProtoReflect.Descriptor instead.
func (*GetSignupsByTeamResponse) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{5}
}

func (x *GetSignupsByTeamResponse) GetSignups() []*SignupInfo {
	if x != nil {
		return x.Signups
	}
	return nil
}

// 报名信息
type SignupInfo struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	SignupId          uint64 `protobuf:"varint,1,opt,name=signupId,proto3" json:"signupId"`
	TeamId            uint64 `protobuf:"varint,2,opt,name=teamId,proto3" json:"teamId"`
	SubmitUserId      uint64 `protobuf:"varint,3,opt,name=submitUserId,proto3" json:"submitUserId"`
	SignupUserId      uint64 `protobuf:"varint,4,opt,name=signupUserId,proto3" json:"signupUserId"`
	SignupCharacterId uint64 `protobuf:"varint,5,opt,name=signupCharacterId,proto3" json:"signupCharacterId"`
	SignupInfo        string `protobuf:"bytes,6,opt,name=signupInfo,proto3" json:"signupInfo"` // 报名补充信息
	Priority          int32  `protobuf:"varint,7,opt,name=priority,proto3" json:"priority"`
	IsRich            bool   `protobuf:"varint,8,opt,name=isRich,proto3" json:"isRich"`
	IsProxy           bool   `protobuf:"varint,9,opt,name=isProxy,proto3" json:"isProxy"`
	ClientType        string `protobuf:"bytes,10,opt,name=clientType,proto3" json:"clientType"`
	LockSlot          int32  `protobuf:"varint,11,opt,name=lockSlot,proto3" json:"lockSlot"`
	IsDove            bool   `protobuf:"varint,12,opt,name=isDove,proto3" json:"isDove"`
	IsCandidate       bool   `protobuf:"varint,13,opt,name=isCandidate,proto3" json:"isCandidate"`
	SignupTime        string `protobuf:"bytes,14,opt,name=signupTime,proto3" json:"signupTime"` // ISO8601 格式
	CancelUserId      uint64 `protobuf:"varint,15,opt,name=cancelUserId,proto3" json:"cancelUserId"`
	CancelTime        string `protobuf:"bytes,16,opt,name=cancelTime,proto3" json:"cancelTime"` // ISO8601 格式
}

func (x *SignupInfo) Reset() {
	*x = SignupInfo{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SignupInfo) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SignupInfo) ProtoMessage() {}

func (x *SignupInfo) ProtoReflect() protoreflect.Message {
	mi := &file_api_XiaoYang_v1_signup_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SignupInfo.ProtoReflect.Descriptor instead.
func (*SignupInfo) Descriptor() ([]byte, []int) {
	return file_api_XiaoYang_v1_signup_proto_rawDescGZIP(), []int{6}
}

func (x *SignupInfo) GetSignupId() uint64 {
	if x != nil {
		return x.SignupId
	}
	return 0
}

func (x *SignupInfo) GetTeamId() uint64 {
	if x != nil {
		return x.TeamId
	}
	return 0
}

func (x *SignupInfo) GetSubmitUserId() uint64 {
	if x != nil {
		return x.SubmitUserId
	}
	return 0
}

func (x *SignupInfo) GetSignupUserId() uint64 {
	if x != nil {
		return x.SignupUserId
	}
	return 0
}

func (x *SignupInfo) GetSignupCharacterId() uint64 {
	if x != nil {
		return x.SignupCharacterId
	}
	return 0
}

func (x *SignupInfo) GetSignupInfo() string {
	if x != nil {
		return x.SignupInfo
	}
	return ""
}

func (x *SignupInfo) GetPriority() int32 {
	if x != nil {
		return x.Priority
	}
	return 0
}

func (x *SignupInfo) GetIsRich() bool {
	if x != nil {
		return x.IsRich
	}
	return false
}

func (x *SignupInfo) GetIsProxy() bool {
	if x != nil {
		return x.IsProxy
	}
	return false
}

func (x *SignupInfo) GetClientType() string {
	if x != nil {
		return x.ClientType
	}
	return ""
}

func (x *SignupInfo) GetLockSlot() int32 {
	if x != nil {
		return x.LockSlot
	}
	return 0
}

func (x *SignupInfo) GetIsDove() bool {
	if x != nil {
		return x.IsDove
	}
	return false
}

func (x *SignupInfo) GetIsCandidate() bool {
	if x != nil {
		return x.IsCandidate
	}
	return false
}

func (x *SignupInfo) GetSignupTime() string {
	if x != nil {
		return x.SignupTime
	}
	return ""
}

func (x *SignupInfo) GetCancelUserId() uint64 {
	if x != nil {
		return x.CancelUserId
	}
	return 0
}

func (x *SignupInfo) GetCancelTime() string {
	if x != nil {
		return x.CancelTime
	}
	return ""
}

var File_api_XiaoYang_v1_signup_proto protoreflect.FileDescriptor

var file_api_XiaoYang_v1_signup_proto_rawDesc = []byte{
	0x0a, 0x1c, 0x61, 0x70, 0x69, 0x2f, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2f, 0x76,
	0x31, 0x2f, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x0f,
	0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x1a,
	0x1c, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x61, 0x6e, 0x6e, 0x6f,
	0x74, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x2e, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x63, 0x2d, 0x67, 0x65, 0x6e, 0x2d, 0x6f, 0x70, 0x65, 0x6e, 0x61, 0x70,
	0x69, 0x76, 0x32, 0x2f, 0x6f, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2f, 0x61, 0x6e, 0x6e, 0x6f,
	0x74, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x13, 0x74,
	0x61, 0x67, 0x67, 0x65, 0x72, 0x2f, 0x74, 0x61, 0x67, 0x67, 0x65, 0x72, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x1a, 0x17, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c,
	0x69, 0x64, 0x61, 0x74, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0xcd, 0x02, 0x0a, 0x13,
	0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x04, 0x52, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x12, 0x22, 0x0a, 0x0c, 0x73,
	0x75, 0x62, 0x6d, 0x69, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x04, 0x52, 0x0c, 0x73, 0x75, 0x62, 0x6d, 0x69, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12,
	0x22, 0x0a, 0x0c, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0c, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x55, 0x73, 0x65,
	0x72, 0x49, 0x64, 0x12, 0x2c, 0x0a, 0x11, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x43, 0x68, 0x61,
	0x72, 0x61, 0x63, 0x74, 0x65, 0x72, 0x49, 0x64, 0x18, 0x04, 0x20, 0x01, 0x28, 0x04, 0x52, 0x11,
	0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x43, 0x68, 0x61, 0x72, 0x61, 0x63, 0x74, 0x65, 0x72, 0x49,
	0x64, 0x12, 0x1e, 0x0a, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x18,
	0x05, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x6e, 0x66,
	0x6f, 0x12, 0x1a, 0x0a, 0x08, 0x70, 0x72, 0x69, 0x6f, 0x72, 0x69, 0x74, 0x79, 0x18, 0x06, 0x20,
	0x01, 0x28, 0x05, 0x52, 0x08, 0x70, 0x72, 0x69, 0x6f, 0x72, 0x69, 0x74, 0x79, 0x12, 0x16, 0x0a,
	0x06, 0x69, 0x73, 0x52, 0x69, 0x63, 0x68, 0x18, 0x07, 0x20, 0x01, 0x28, 0x08, 0x52, 0x06, 0x69,
	0x73, 0x52, 0x69, 0x63, 0x68, 0x12, 0x18, 0x0a, 0x07, 0x69, 0x73, 0x50, 0x72, 0x6f, 0x78, 0x79,
	0x18, 0x08, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x69, 0x73, 0x50, 0x72, 0x6f, 0x78, 0x79, 0x12,
	0x1e, 0x0a, 0x0a, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x54, 0x79, 0x70, 0x65, 0x18, 0x09, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x0a, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x54, 0x79, 0x70, 0x65, 0x12,
	0x1a, 0x0a, 0x08, 0x6c, 0x6f, 0x63, 0x6b, 0x53, 0x6c, 0x6f, 0x74, 0x18, 0x0a, 0x20, 0x01, 0x28,
	0x05, 0x52, 0x08, 0x6c, 0x6f, 0x63, 0x6b, 0x53, 0x6c, 0x6f, 0x74, 0x22, 0x30, 0x0a, 0x14, 0x43,
	0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x73, 0x70, 0x6f,
	0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x22, 0x55, 0x0a,
	0x13, 0x43, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x12, 0x1a, 0x0a, 0x08, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x64,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x08, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x64,
	0x12, 0x22, 0x0a, 0x0c, 0x63, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0c, 0x63, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x55, 0x73,
	0x65, 0x72, 0x49, 0x64, 0x22, 0x30, 0x0a, 0x14, 0x43, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x53, 0x69,
	0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07,
	0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73,
	0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x22, 0x31, 0x0a, 0x17, 0x47, 0x65, 0x74, 0x53, 0x69, 0x67,
	0x6e, 0x75, 0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61, 0x6d, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73,
	0x74, 0x12, 0x16, 0x0a, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x04, 0x52, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x22, 0x51, 0x0a, 0x18, 0x47, 0x65, 0x74,
	0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61, 0x6d, 0x52, 0x65, 0x73,
	0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x35, 0x0a, 0x07, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x73,
	0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x1b, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61,
	0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49,
	0x6e, 0x66, 0x6f, 0x52, 0x07, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x73, 0x22, 0xfe, 0x03, 0x0a,
	0x0a, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x1a, 0x0a, 0x08, 0x73,
	0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x08, 0x73,
	0x69, 0x67, 0x6e, 0x75, 0x70, 0x49, 0x64, 0x12, 0x16, 0x0a, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49,
	0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x06, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x12,
	0x22, 0x0a, 0x0c, 0x73, 0x75, 0x62, 0x6d, 0x69, 0x74, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0c, 0x73, 0x75, 0x62, 0x6d, 0x69, 0x74, 0x55, 0x73, 0x65,
	0x72, 0x49, 0x64, 0x12, 0x22, 0x0a, 0x0c, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x55, 0x73, 0x65,
	0x72, 0x49, 0x64, 0x18, 0x04, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0c, 0x73, 0x69, 0x67, 0x6e, 0x75,
	0x70, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12, 0x2c, 0x0a, 0x11, 0x73, 0x69, 0x67, 0x6e, 0x75,
	0x70, 0x43, 0x68, 0x61, 0x72, 0x61, 0x63, 0x74, 0x65, 0x72, 0x49, 0x64, 0x18, 0x05, 0x20, 0x01,
	0x28, 0x04, 0x52, 0x11, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x43, 0x68, 0x61, 0x72, 0x61, 0x63,
	0x74, 0x65, 0x72, 0x49, 0x64, 0x12, 0x1e, 0x0a, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x49,
	0x6e, 0x66, 0x6f, 0x18, 0x06, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x75,
	0x70, 0x49, 0x6e, 0x66, 0x6f, 0x12, 0x1a, 0x0a, 0x08, 0x70, 0x72, 0x69, 0x6f, 0x72, 0x69, 0x74,
	0x79, 0x18, 0x07, 0x20, 0x01, 0x28, 0x05, 0x52, 0x08, 0x70, 0x72, 0x69, 0x6f, 0x72, 0x69, 0x74,
	0x79, 0x12, 0x16, 0x0a, 0x06, 0x69, 0x73, 0x52, 0x69, 0x63, 0x68, 0x18, 0x08, 0x20, 0x01, 0x28,
	0x08, 0x52, 0x06, 0x69, 0x73, 0x52, 0x69, 0x63, 0x68, 0x12, 0x18, 0x0a, 0x07, 0x69, 0x73, 0x50,
	0x72, 0x6f, 0x78, 0x79, 0x18, 0x09, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x69, 0x73, 0x50, 0x72,
	0x6f, 0x78, 0x79, 0x12, 0x1e, 0x0a, 0x0a, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x54, 0x79, 0x70,
	0x65, 0x18, 0x0a, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x54,
	0x79, 0x70, 0x65, 0x12, 0x1a, 0x0a, 0x08, 0x6c, 0x6f, 0x63, 0x6b, 0x53, 0x6c, 0x6f, 0x74, 0x18,
	0x0b, 0x20, 0x01, 0x28, 0x05, 0x52, 0x08, 0x6c, 0x6f, 0x63, 0x6b, 0x53, 0x6c, 0x6f, 0x74, 0x12,
	0x16, 0x0a, 0x06, 0x69, 0x73, 0x44, 0x6f, 0x76, 0x65, 0x18, 0x0c, 0x20, 0x01, 0x28, 0x08, 0x52,
	0x06, 0x69, 0x73, 0x44, 0x6f, 0x76, 0x65, 0x12, 0x20, 0x0a, 0x0b, 0x69, 0x73, 0x43, 0x61, 0x6e,
	0x64, 0x69, 0x64, 0x61, 0x74, 0x65, 0x18, 0x0d, 0x20, 0x01, 0x28, 0x08, 0x52, 0x0b, 0x69, 0x73,
	0x43, 0x61, 0x6e, 0x64, 0x69, 0x64, 0x61, 0x74, 0x65, 0x12, 0x1e, 0x0a, 0x0a, 0x73, 0x69, 0x67,
	0x6e, 0x75, 0x70, 0x54, 0x69, 0x6d, 0x65, 0x18, 0x0e, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x73,
	0x69, 0x67, 0x6e, 0x75, 0x70, 0x54, 0x69, 0x6d, 0x65, 0x12, 0x22, 0x0a, 0x0c, 0x63, 0x61, 0x6e,
	0x63, 0x65, 0x6c, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x18, 0x0f, 0x20, 0x01, 0x28, 0x04, 0x52,
	0x0c, 0x63, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x55, 0x73, 0x65, 0x72, 0x49, 0x64, 0x12, 0x1e, 0x0a,
	0x0a, 0x63, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x54, 0x69, 0x6d, 0x65, 0x18, 0x10, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x0a, 0x63, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x54, 0x69, 0x6d, 0x65, 0x32, 0xe8, 0x04,
	0x0a, 0x0d, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12,
	0xba, 0x01, 0x0a, 0x0c, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70,
	0x12, 0x24, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e,
	0x76, 0x31, 0x2e, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x52,
	0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x25, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61,
	0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x53,
	0x69, 0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x5d, 0x92,
	0x41, 0x34, 0x12, 0x06, 0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0x1a, 0x18, 0xe5, 0x88, 0x9b, 0xe5,
	0xbb, 0xba, 0xe6, 0x96, 0xb0, 0xe7, 0x9a, 0x84, 0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0xe8, 0xae,
	0xb0, 0xe5, 0xbd, 0x95, 0x62, 0x10, 0x0a, 0x0e, 0x0a, 0x0a, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72,
	0x41, 0x75, 0x74, 0x68, 0x12, 0x00, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x20, 0x3a, 0x01, 0x2a, 0x22,
	0x1b, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x2f,
	0x63, 0x72, 0x65, 0x61, 0x74, 0x65, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x12, 0xba, 0x01, 0x0a,
	0x0c, 0x43, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x12, 0x24, 0x2e,
	0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e,
	0x43, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x1a, 0x25, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61,
	0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x43, 0x61, 0x6e, 0x63, 0x65, 0x6c, 0x53, 0x69, 0x67, 0x6e,
	0x75, 0x70, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x5d, 0x92, 0x41, 0x34, 0x12,
	0x0c, 0xe5, 0x8f, 0x96, 0xe6, 0xb6, 0x88, 0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0x1a, 0x12, 0xe5,
	0x8f, 0x96, 0xe6, 0xb6, 0x88, 0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0xe8, 0xae, 0xb0, 0xe5, 0xbd,
	0x95, 0x62, 0x10, 0x0a, 0x0e, 0x0a, 0x0a, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74,
	0x68, 0x12, 0x00, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x20, 0x3a, 0x01, 0x2a, 0x22, 0x1b, 0x2f, 0x61,
	0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x2f, 0x63, 0x61, 0x6e,
	0x63, 0x65, 0x6c, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x12, 0xdc, 0x01, 0x0a, 0x10, 0x47, 0x65,
	0x74, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61, 0x6d, 0x12, 0x28,
	0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31,
	0x2e, 0x47, 0x65, 0x74, 0x53, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61,
	0x6d, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x29, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x58,
	0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2e, 0x76, 0x31, 0x2e, 0x47, 0x65, 0x74, 0x53, 0x69,
	0x67, 0x6e, 0x75, 0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f,
	0x6e, 0x73, 0x65, 0x22, 0x73, 0x92, 0x41, 0x46, 0x12, 0x12, 0xe8, 0x8e, 0xb7, 0xe5, 0x8f, 0x96,
	0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0xe4, 0xbf, 0xa1, 0xe6, 0x81, 0xaf, 0x1a, 0x1e, 0xe6, 0xa0,
	0xb9, 0xe6, 0x8d, 0xae, 0x74, 0x65, 0x61, 0x6d, 0x49, 0x64, 0xe8, 0x8e, 0xb7, 0xe5, 0x8f, 0x96,
	0xe6, 0x8a, 0xa5, 0xe5, 0x90, 0x8d, 0xe4, 0xbf, 0xa1, 0xe6, 0x81, 0xaf, 0x62, 0x10, 0x0a, 0x0e,
	0x0a, 0x0a, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12, 0x00, 0x82, 0xd3,
	0xe4, 0x93, 0x02, 0x24, 0x3a, 0x01, 0x2a, 0x22, 0x1f, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31,
	0x2f, 0x73, 0x69, 0x67, 0x6e, 0x75, 0x70, 0x2f, 0x67, 0x65, 0x74, 0x53, 0x69, 0x67, 0x6e, 0x75,
	0x70, 0x73, 0x42, 0x79, 0x54, 0x65, 0x61, 0x6d, 0x42, 0xc9, 0x01, 0x92, 0x41, 0xa8, 0x01, 0x12,
	0x1f, 0x0a, 0x18, 0x78, 0x69, 0x61, 0x6f, 0x79, 0x61, 0x6e, 0x67, 0x20, 0x73, 0x69, 0x67, 0x6e,
	0x75, 0x70, 0x20, 0x61, 0x70, 0x69, 0x20, 0x64, 0x6f, 0x63, 0x73, 0x32, 0x03, 0x31, 0x2e, 0x30,
	0x1a, 0x0e, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x68, 0x6f, 0x73, 0x74, 0x3a, 0x38, 0x30, 0x38, 0x30,
	0x2a, 0x02, 0x01, 0x02, 0x32, 0x10, 0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x2f, 0x6a, 0x73, 0x6f, 0x6e, 0x3a, 0x10, 0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74,
	0x69, 0x6f, 0x6e, 0x2f, 0x6a, 0x73, 0x6f, 0x6e, 0x5a, 0x4d, 0x0a, 0x4b, 0x0a, 0x0a, 0x42, 0x65,
	0x61, 0x72, 0x65, 0x72, 0x41, 0x75, 0x74, 0x68, 0x12, 0x3d, 0x08, 0x02, 0x12, 0x28, 0x49, 0x6e,
	0x70, 0x75, 0x74, 0x20, 0x61, 0x20, 0x22, 0x42, 0x65, 0x61, 0x72, 0x65, 0x72, 0x20, 0x79, 0x6f,
	0x75, 0x72, 0x2d, 0x6a, 0x77, 0x74, 0x2d, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x22, 0x20, 0x74, 0x6f,
	0x20, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x1a, 0x0d, 0x41, 0x75, 0x74, 0x68, 0x6f, 0x72, 0x69, 0x7a,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x02, 0x5a, 0x1b, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e,
	0x67, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x58, 0x69, 0x61, 0x6f, 0x59, 0x61, 0x6e, 0x67, 0x2f, 0x76,
	0x31, 0x3b, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_api_XiaoYang_v1_signup_proto_rawDescOnce sync.Once
	file_api_XiaoYang_v1_signup_proto_rawDescData = file_api_XiaoYang_v1_signup_proto_rawDesc
)

func file_api_XiaoYang_v1_signup_proto_rawDescGZIP() []byte {
	file_api_XiaoYang_v1_signup_proto_rawDescOnce.Do(func() {
		file_api_XiaoYang_v1_signup_proto_rawDescData = protoimpl.X.CompressGZIP(file_api_XiaoYang_v1_signup_proto_rawDescData)
	})
	return file_api_XiaoYang_v1_signup_proto_rawDescData
}

var file_api_XiaoYang_v1_signup_proto_msgTypes = make([]protoimpl.MessageInfo, 7)
var file_api_XiaoYang_v1_signup_proto_goTypes = []any{
	(*CreateSignupRequest)(nil),      // 0: api.XiaoYang.v1.CreateSignupRequest
	(*CreateSignupResponse)(nil),     // 1: api.XiaoYang.v1.CreateSignupResponse
	(*CancelSignupRequest)(nil),      // 2: api.XiaoYang.v1.CancelSignupRequest
	(*CancelSignupResponse)(nil),     // 3: api.XiaoYang.v1.CancelSignupResponse
	(*GetSignupsByTeamRequest)(nil),  // 4: api.XiaoYang.v1.GetSignupsByTeamRequest
	(*GetSignupsByTeamResponse)(nil), // 5: api.XiaoYang.v1.GetSignupsByTeamResponse
	(*SignupInfo)(nil),               // 6: api.XiaoYang.v1.SignupInfo
}
var file_api_XiaoYang_v1_signup_proto_depIdxs = []int32{
	6, // 0: api.XiaoYang.v1.GetSignupsByTeamResponse.signups:type_name -> api.XiaoYang.v1.SignupInfo
	0, // 1: api.XiaoYang.v1.SignupService.CreateSignup:input_type -> api.XiaoYang.v1.CreateSignupRequest
	2, // 2: api.XiaoYang.v1.SignupService.CancelSignup:input_type -> api.XiaoYang.v1.CancelSignupRequest
	4, // 3: api.XiaoYang.v1.SignupService.GetSignupsByTeam:input_type -> api.XiaoYang.v1.GetSignupsByTeamRequest
	1, // 4: api.XiaoYang.v1.SignupService.CreateSignup:output_type -> api.XiaoYang.v1.CreateSignupResponse
	3, // 5: api.XiaoYang.v1.SignupService.CancelSignup:output_type -> api.XiaoYang.v1.CancelSignupResponse
	5, // 6: api.XiaoYang.v1.SignupService.GetSignupsByTeam:output_type -> api.XiaoYang.v1.GetSignupsByTeamResponse
	4, // [4:7] is the sub-list for method output_type
	1, // [1:4] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_api_XiaoYang_v1_signup_proto_init() }
func file_api_XiaoYang_v1_signup_proto_init() {
	if File_api_XiaoYang_v1_signup_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_api_XiaoYang_v1_signup_proto_msgTypes[0].Exporter = func(v any, i int) any {
			switch v := v.(*CreateSignupRequest); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[1].Exporter = func(v any, i int) any {
			switch v := v.(*CreateSignupResponse); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[2].Exporter = func(v any, i int) any {
			switch v := v.(*CancelSignupRequest); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[3].Exporter = func(v any, i int) any {
			switch v := v.(*CancelSignupResponse); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[4].Exporter = func(v any, i int) any {
			switch v := v.(*GetSignupsByTeamRequest); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[5].Exporter = func(v any, i int) any {
			switch v := v.(*GetSignupsByTeamResponse); i {
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
		file_api_XiaoYang_v1_signup_proto_msgTypes[6].Exporter = func(v any, i int) any {
			switch v := v.(*SignupInfo); i {
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
			RawDescriptor: file_api_XiaoYang_v1_signup_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   7,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_api_XiaoYang_v1_signup_proto_goTypes,
		DependencyIndexes: file_api_XiaoYang_v1_signup_proto_depIdxs,
		MessageInfos:      file_api_XiaoYang_v1_signup_proto_msgTypes,
	}.Build()
	File_api_XiaoYang_v1_signup_proto = out.File
	file_api_XiaoYang_v1_signup_proto_rawDesc = nil
	file_api_XiaoYang_v1_signup_proto_goTypes = nil
	file_api_XiaoYang_v1_signup_proto_depIdxs = nil
}
