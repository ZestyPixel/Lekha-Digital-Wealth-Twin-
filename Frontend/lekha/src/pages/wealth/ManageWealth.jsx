import LumpSum from "../../components/wealthCards/LumpSum";
import StartSIP from "../../components/wealthCards/StartSIP";
import WithdrawTransfer from "../../components/wealthCards/WithdrawTransfer";
import "./ManageWealth.css";
import { Link } from "react-router-dom";
import LumpsumInvestment from "./LumpForm";
import SIPInvestment from "./SipForm";
import TransferWithdraw from "./TransferWithdrawForm";

export default function ManageWealth(){
    return(
        <div className="card-container">
            <div className="lumpsum-form">
                <Link to={'/lump'}><LumpSum Title={'Lumpsum Investment'}/></Link>
            </div>
            <div className="sip">
                <Link to={'/sip'}><StartSIP Title={'Systematic Investment Plan (SIP)'}/></Link>
            </div>
            <div className="transfer-withdraw">
                <Link to={'/transfer'}><WithdrawTransfer Title={'Transfer/Withdraw'}/></Link>
            </div>
        </div>
    );
}