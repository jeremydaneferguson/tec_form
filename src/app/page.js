import Image from "next/image";
import TECAssessmentForm from '@/components/TECAssessmentForm';
import LoginGate from '@/components/LoginGate';

export default function Home() {
  return (
    <LoginGate>
      <TECAssessmentForm />
    </LoginGate>
  );
}
