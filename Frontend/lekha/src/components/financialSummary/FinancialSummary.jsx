import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/functions";
import "./FinancialSummary.css";

export default function FinancialSummary() {
  const { user, requestWithAuth } = useAuth();
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem("protectedData");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await requestWithAuth("/getUserData");
        if (!response.ok) return;
        const result = await response.json();
        if (isMounted) {
          setData(result);
          localStorage.setItem("protectedData", JSON.stringify(result));
        }
      } catch (err) {
        console.error("Error loading financial summary:", err);
      }
    };

    if (user) loadData();
    return () => {
      isMounted = false;
    };
  }, [user, requestWithAuth]);

  if (!data) return null;

  const assets = data.asset || [];
  const debts = data.debt || [];
  const goals = data.goal || [];
  const profile = data.profile || {};
  const finances = data.finances?.[0] || {};

  // Bank & Invested Assets calculation
  const isBank = (type) => {
    const t = (type || "").toLowerCase();
    return t.includes("bank") || t.includes("account") || t.includes("cash");
  };

  const bankBalance =
    assets
      .filter((a) => isBank(a.type))
      .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0) ||
    (finances.bankBalance ?? 0);

  const investedAssets =
    assets
      .filter((a) => !isBank(a.type))
      .reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0) ||
    (finances.investedAssets ?? 0);

  const totalAssets =
    assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0) ||
    (finances.totalAssets ?? 0);

  // Debts & Liabilities
  const totalRemainingDebt =
    debts.reduce((sum, d) => sum + (Number(d.remainingBalance) || 0), 0) ||
    (finances.totalRemainingBalance ?? 0);

  const totalMonthlyEMI =
    debts.reduce((sum, d) => sum + (Number(d.monthlyEMI) || 0), 0) ||
    (finances.totalMonthlyEMI ?? 0);

  // Net Worth
  const netWorth = totalAssets - totalRemainingDebt;

  // Monthly Cash Flow & Surplus
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const totalBudgetedExpenses =
    (Number(profile.bills) || 0) +
    (Number(profile.food) || 0) +
    (Number(profile.health) || 0) +
    (Number(profile.lifestyle) || 0) +
    (Number(profile.transport) || 0) +
    (Number(profile.obligations) || 0) +
    (Number(profile.misc) || 0);

  const monthlySurplus = Math.max(
    monthlyIncome - totalBudgetedExpenses - totalMonthlyEMI,
    0
  );

  // Health Metrics
  const rawSavingsRate =
    monthlyIncome > 0
      ? (Number(profile.savings) || 0) / monthlyIncome
      : (finances.savingsRate ?? 0);
  const savingsRatePercent =
    rawSavingsRate <= 1 && rawSavingsRate > 0
      ? (rawSavingsRate * 100).toFixed(1)
      : Number(rawSavingsRate || 0).toFixed(1);

  const emergencyMonths =
    totalBudgetedExpenses > 0
      ? (bankBalance / totalBudgetedExpenses).toFixed(1)
      : (finances.emergencyMonths ? Number(finances.emergencyMonths).toFixed(1) : "0.0");

  return (
    <div className="wealth-summary-wide">
      {/* Row 1: High-Density Key Metrics Ribbon */}
      <div className="summary-ribbon">
        <div className="ribbon-item hero-item">
          <span className="ribbon-label">Net Worth</span>
          <span className="ribbon-val text-primary">{formatCurrency(netWorth)}</span>
        </div>

        <div className="ribbon-separator" />

        <div className="ribbon-item">
          <span className="ribbon-label">Bank Balance</span>
          <span className="ribbon-val text-blue">{formatCurrency(bankBalance)}</span>
        </div>

        <div className="ribbon-item">
          <span className="ribbon-label">Invested Assets</span>
          <span className="ribbon-val">{formatCurrency(investedAssets)}</span>
        </div>

        <div className="ribbon-item">
          <span className="ribbon-label">Total Debt</span>
          <span className="ribbon-val text-red">{formatCurrency(totalRemainingDebt)}</span>
        </div>

        <div className="ribbon-separator" />

        <div className="ribbon-item">
          <span className="ribbon-label">Monthly Surplus (SIP)</span>
          <span className="ribbon-val text-green">{formatCurrency(monthlySurplus)}</span>
        </div>

        <div className="ribbon-item">
          <span className="ribbon-label">Savings Rate</span>
          <span className="ribbon-val">{savingsRatePercent}%</span>
        </div>

        <div className="ribbon-item">
          <span className="ribbon-label">Emergency Buffer</span>
          <span className="ribbon-val">{emergencyMonths} mo</span>
        </div>
      </div>

      {/* Row 2: Streamlined 3-Column Overview */}
      <div className="summary-columns-compact">
        {/* Col 1: Cashflow */}
        <div className="compact-col">
          <div className="compact-header">
            <span>Cashflow Breakdown</span>
          </div>
          <div className="compact-body">
            <div className="compact-row">
              <span>Monthly Income:</span>
              <b>{formatCurrency(monthlyIncome)}</b>
            </div>
            <div className="compact-row">
              <span>Expenses:</span>
              <span>{formatCurrency(totalBudgetedExpenses)}</span>
            </div>
            <div className="compact-row">
              <span>Monthly EMI:</span>
              <span className="text-red">{formatCurrency(totalMonthlyEMI)}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Active Debts */}
        <div className="compact-col">
          <div className="compact-header">
            <span>Active Debts ({debts.length})</span>
            {debts.length > 0 && (
              <span className="header-hint text-red">{formatCurrency(totalRemainingDebt)}</span>
            )}
          </div>
          <div className="compact-body">
            {debts.length === 0 ? (
              <div className="text-green text-sm">✓ 100% Debt Free</div>
            ) : (
              debts.map((d, i) => (
                <div key={i} className="compact-row">
                  <span className="item-name">{d.debtName}</span>
                  <span className="text-red">
                    {formatCurrency(d.remainingBalance || 0)}{" "}
                    <small className="text-muted">(EMI: {formatCurrency(d.monthlyEMI || 0)})</small>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 3: Goals */}
        <div className="compact-col">
          <div className="compact-header">
            <span>Goals & Targets ({goals.length})</span>
          </div>
          <div className="compact-body">
            {goals.length === 0 ? (
              <div className="text-muted text-sm">No active goals</div>
            ) : (
              goals.map((g, i) => {
                const target = Number(g.targetAmount) || 1;
                const current = Number(g.currentProgress) || 0;
                const pct = Math.min(Math.round((current / target) * 100), 100);
                return (
                  <div key={i} className="compact-row">
                    <span className="item-name">{g.goalName}</span>
                    <span>
                      <b>{pct}%</b> of {formatCurrency(g.targetAmount || 0)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
