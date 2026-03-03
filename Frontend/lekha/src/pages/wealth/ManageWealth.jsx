import LumpSum from "../../components/wealthCards/LumpSum";
import StartSIP from "../../components/wealthCards/StartSIP";
import WithdrawTransfer from "../../components/wealthCards/WithdrawTransfer";
import "./ManageWealth.css";
import LumpsumInvestment from "./temp";

export default function ManageWealth(){
    return(
        <div className="container">
            <div className="lumpsum-form">
                <LumpsumInvestment/>
            </div>
            <div className="sip">
                SIP
            </div>
            <div className="transfer-withdraw">
                Transfer
            </div>
        </div>
    );
}