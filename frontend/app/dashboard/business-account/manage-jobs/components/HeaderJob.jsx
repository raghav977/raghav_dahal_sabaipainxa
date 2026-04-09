
"use client"
export default function HeaderJob({title,description,buttonText,buttonUrl}){

    const handleButtonClick = () => {
        if (buttonUrl) {
            window.location.href = buttonUrl;
        } else if (handleClick) {
            handleClick();
        }
    }
    return(
        <div className="flex gap-4 mb-6 items-center justify-between">
            <div>

            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-gray-600">{description}</p>
            </div>
            <div>
            <button className="bg-[#019561] text-white px-4 py-2 rounded cursor-pointer" onClick={handleButtonClick} >{buttonText}</button>
            </div>
        </div>
    )
}