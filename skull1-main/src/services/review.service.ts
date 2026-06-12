import { ReviewRepository } from '../repositories/review.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ReviewResponseDTO, formatReviewResponse } from '../dto/review.dto';
import { AppError } from '../middlewares/error.middleware';

const reviewRepository = new ReviewRepository();
const productRepository = new ProductRepository();

export class ReviewService {
  async getProductReviews(productId: string): Promise<ReviewResponseDTO[]> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    const reviews = await reviewRepository.findByProductId(productId);
    return reviews.map(formatReviewResponse);
  }

  async createReview(userId: string, productId: string, data: any): Promise<ReviewResponseDTO> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new AppError(400, 'Rating must be between 1 and 5');
    }

    const review = await reviewRepository.create({
      productId,
      userId,
      rating: data.rating,
      comment: data.comment,
      images: data.images,
    });

    const fullReview = await reviewRepository.findById(review.id);
    return formatReviewResponse(fullReview!);
  }

  async updateReview(userId: string, reviewId: string, data: any): Promise<ReviewResponseDTO> {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this review');
    }

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new AppError(400, 'Rating must be between 1 and 5');
    }

    await reviewRepository.update(reviewId, data);
    const refreshed = await reviewRepository.findById(reviewId);
    return formatReviewResponse(refreshed!);
  }

  async deleteReview(userId: string, reviewId: string, isAdmin: boolean = false): Promise<void> {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new AppError(403, 'Forbidden deletion access to this review');
    }

    await reviewRepository.delete(reviewId);
  }

  async getAllReviews(page: number = 1, limit: number = 10): Promise<any> {
    const { reviews, total } = await reviewRepository.findAll(page, limit);
    return {
      data: reviews.map(formatReviewResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async hideReview(reviewId: string): Promise<ReviewResponseDTO> {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError(404, 'Review not found');
    }
    await reviewRepository.setVisibility(reviewId, true);
    const refreshed = await reviewRepository.findById(reviewId);
    return formatReviewResponse(refreshed!);
  }

  async showReview(reviewId: string): Promise<ReviewResponseDTO> {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError(404, 'Review not found');
    }
    await reviewRepository.setVisibility(reviewId, false);
    const refreshed = await reviewRepository.findById(reviewId);
    return formatReviewResponse(refreshed!);
  }
}

export default ReviewService;
