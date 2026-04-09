import Link from "next/link";

export default function BusinessAccountDisclaimer(){
    return(
        <div>
            <h1 className="text-3xl font-bold text-center mt-10">Business Account Disclaimer</h1>
            <p className="text-lg text-gray-700 mt-6 max-w-3xl mx-auto text-center">
                By creating a business account on SabaiPainxa, you acknowledge and agree to the following terms and conditions:
            </p>
            <ul className="list-disc list-inside mt-4 max-w-3xl mx-auto text-gray-700">
                <li>You are authorized to create and manage a business account on behalf of your company or organization.</li>
                <li>You will provide accurate and up-to-date information about your business during the registration process.</li>
                <li>You will comply with all applicable laws and regulations related to your business activities on SabaiPainxa.</li>
                <li>You understand that SabaiPainxa is a platform for connecting service providers with customers, and we do not guarantee any specific outcomes or results from using our services.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your business account.</li>
                <li>You will not use your business account for any fraudulent, illegal, or unauthorized purposes.</li>
                <li>You understand that SabaiPainxa may suspend or terminate your business account if you violate these terms or engage in any misconduct.</li>
            </ul>
             <p className="text-lg text-gray-700 mt-6 max-w-3xl mx-auto text-center">
                By proceeding with the creation of a business account, you confirm that you have read, understood, and agreed to this disclaimer and the terms and conditions of SabaiPainxa.
            </p>
            <p className="text-lg mt-6 max-w-3xl mx-auto text-center text-red-500">Note: The email must be unique. It should not be linked to provider or gharbeti email. We recommend using business email </p>

            <div className="mt-10 max-w-3xl mx-auto text-center">
                <Link href="/business-account/create" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition"> 
                Proceed to Create Business Account
                </Link>
                <Link href="/" className="inline-block ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-md transition">
                Cancel
                </Link>
            </div>
        </div>
    )
}