export declare enum PostStatusAdmin {
    APPROVED = "approved",
    REJECTED = "rejected",
    HIDDEN = "hidden"
}
export declare class UpdatePostStatusDto {
    status: PostStatusAdmin;
}
