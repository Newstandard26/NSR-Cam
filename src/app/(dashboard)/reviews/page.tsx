import { ReviewDashboard } from "@/components/reviews/review-dashboard"

export default function ReviewsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h1>
      <ReviewDashboard />
    </div>
  )
}
