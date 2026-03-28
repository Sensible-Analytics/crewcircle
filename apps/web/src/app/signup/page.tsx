import SignupForm from '@/components/SignupForm';
import Logo from '@/components/Logo';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto mb-8 text-center">
        <Logo size="lg" />
      </div>
      <SignupForm />
    </div>
  );
}
