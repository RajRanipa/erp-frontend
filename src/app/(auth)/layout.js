
// app/(auth)/layout.js
export default function AuthLayout({ children }) {
  return (
    <div className="h-screen max-h-screen w-full bg-primary overflow-hidden">
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}