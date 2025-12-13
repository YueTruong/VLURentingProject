export declare class UpdatePostDto {
    title?: string;
    description?: string;
    price?: number;
    area?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    max_occupancy?: number;
    categoryId?: number;
    amenityIds?: number[];
    imageUrls?: string[];
    status?: 'approved' | 'rented' | 'hidden';
}
