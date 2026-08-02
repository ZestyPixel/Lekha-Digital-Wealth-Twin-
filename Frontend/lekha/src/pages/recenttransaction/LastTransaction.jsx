import { useLocation } from "react-router-dom";
import TransactionCard from "../../components/transactionCard/TransactionCard";

export default function RecentTransactions() {
  const location = useLocation();
  const transaction = location.state;
  return (
    <div className="card-container">
      {transaction.map((el) => (
        <TransactionCard
          key={el._id}
          Amount={el.amount}
          Category={el.category}
          CreatedAt={el.createdAt}
        />
      ))}
    </div>
  );
}
