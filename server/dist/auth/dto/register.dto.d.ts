export declare enum RegisterRole {
    STUDENT = "student",
    OWNER = "owner"
}
export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: RegisterRole;
}
