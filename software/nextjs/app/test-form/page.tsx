import { RegistrationForm } from "@/components/registration-form";

export default function TestFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Event Registration
          </h1>
          <p className="text-gray-600">PowerHouseGames 2026</p>
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Test Page - Form UI Only (No Database)
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <RegistrationForm />
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This is a test page to verify the form UI and validation.</p>
          <p>Form data is logged to the browser console.</p>
        </div>
      </div>
    </div>
  );
}

