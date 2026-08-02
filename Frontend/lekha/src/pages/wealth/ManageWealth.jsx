import LumpSum from "../../components/wealthCards/LumpSum";
import StartSIP from "../../components/wealthCards/StartSIP";
import WithdrawTransfer from "../../components/wealthCards/WithdrawTransfer";
import FinancialSummary from "../../components/financialSummary/FinancialSummary";
import "./ManageWealth.css";
import { Link } from "react-router-dom";

export default function ManageWealth() {
  return (
    <>
      <div className="card-container-wealth">
        <div className="lumpsum-form">
          <Link to={"/lump"}>
            <LumpSum Title={"Lumpsum Investment"} />
          </Link>
        </div>
        <div className="sip">
          <Link to={"/sip"}>
            <StartSIP Title={"Systematic Investment Plan (SIP)"} />
          </Link>
        </div>
        <div className="transfer-withdraw">
          <Link to={"/transfer"}>
            <WithdrawTransfer Title={"Transfer/Withdraw"} />
          </Link>
        </div>
      </div>
      <FinancialSummary />
    </>
  );
}
