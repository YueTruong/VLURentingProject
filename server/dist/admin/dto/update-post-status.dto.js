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
exports.UpdatePostStatusDto = exports.PostStatusAdmin = void 0;
const class_validator_1 = require("class-validator");
var PostStatusAdmin;
(function (PostStatusAdmin) {
    PostStatusAdmin["APPROVED"] = "approved";
    PostStatusAdmin["REJECTED"] = "rejected";
    PostStatusAdmin["HIDDEN"] = "hidden";
})(PostStatusAdmin || (exports.PostStatusAdmin = PostStatusAdmin = {}));
class UpdatePostStatusDto {
    status;
}
exports.UpdatePostStatusDto = UpdatePostStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(PostStatusAdmin, {
        message: `Trạng thái phải là một trong các giá trị: ${Object.values(PostStatusAdmin).join(', ')}`,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Trạng thái không được để trống' }),
    __metadata("design:type", String)
], UpdatePostStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-post-status.dto.js.map