import HeaderNavbar from "../landingpagecomponents/components/HeaderNavbar";
import BusinessAccountDisclaimer from "./components/BusinessAccountDisclaimer";

export default function BusinessAccount(){
    return(
        <div>
            <HeaderNavbar/>
            <div className="mt-14 border">


            <BusinessAccountDisclaimer/>
            </div>



        </div>
    )
}