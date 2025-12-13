"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.RegisterRole = void 0;
const class_validator_1 = require("class-validator");
var RegisterRole;
(function (RegisterRole) {
    RegisterRole["STUDENT"] = "student";
    RegisterRole["OWNER"] = "owner";
})(RegisterRole || (exports.RegisterRole = RegisterRole = {}));
class RegisterDto {
    email;
    password;
    fullName;
    phoneNumber;
    role;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Email không hợp lệ.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email không được để trống.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mật khẩu không được để trống.' }),
    (0, class_validator_1.MinLength)(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Họ tên không được để trống.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)('VN', { message: 'Số điện thoại không hợp lệ.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Số điện thoại không được để trống.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RegisterRole, { message: 'Vai trò không hợp lệ.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vai trò không được để trống.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
//# sourceMappingURL=register.dto.js.map