export default function BusinessAccountModal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-2xl"
      onClick={onClose} // outside click
    >
      <div
        className="p-6 rounded shadow-md w-full max-w-md bg-gradient-to-br from-green-50 to-white bg-green-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="text-lg font-bold mb-4 text-green-700">Business Account</h2>
        <p className="mb-4 ">
          Please fill in the details to create a business account.
        </p>

        {/* passing children */}
        {children}
        
      </div>
    </div>
  );
}