import UserTopBar from "@/app/homepage/components/UserTopBar"
import PostWizard from "./PostWizard"

export default function PostPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserTopBar />
      <PostWizard />
    </div>
  )
}
