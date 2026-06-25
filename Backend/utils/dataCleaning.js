function cleanAsset(asset) {
    return {
        type: asset.type,
        value: asset.currentValue,
        institution: asset.institution,
    };
}

function cleanGoals(goals){
    return{
        goal: goals.goalName,
        targetAmount: goals.targetAmount,
        currentProgress: goals.currentProgress,
        deadline: goals.targetDate,
        priority: goals.priority,
    }
}

function cleanDebts(debt){
    return{
        name: debt.debtName,
        amount: debt.totalAmount,
        remainingAmount: debt.remainingBalance,
        EMI: debt.monthlyEMI,
    }
}

function cleanFinances(finances) {
    return {
        bankBalance: finances.bankBalance,
        totalAssets: finances.totalAssets,
        investedAssets: finances.investedAssets,
        netWorth: finances.netWorth,
        totalRemainingBalance: finances.totalRemainingBalance,
        totalMonthlyEMI: finances.totalMonthlyEMI,
        essentialExpenses: finances.essentialExpenses,
        savingsRate: round(finances.savingsRate),
        discretionaryRate: round(finances.discretionaryRate),
        dtiRatio: round(finances.dtiRatio),
        investmentRatio: round(finances.investmentRatio),
        emergencyMonths: round(finances.emergencyMonths),
        hasBadDebt: finances.hasBadDebt,
        score: finances.score,
        breakdown: finances.breakdown,
    };
}

function round(n) {
    return Math.round(n * 10000) / 10000; //To remove decimal places after 4.
}

function cleanProfile(profile) {
    return {
        monthlyIncome: profile.monthlyIncome,
        age: profile.age,
        riskProfile: profile.riskProfile,
        bills: profile.bills,
        food: profile.food,
        transport: profile.transport,
        health: profile.health,
        lifestyle: profile.lifestyle,
        misc: profile.misc,
        obligations: profile.obligations,
        savings: profile.savings,
        lastUpdated: profile.updatedAt.toISOString().slice(0, 10),
    };
}

function extractStockContext(data) {
    const {
        companyName,
        industry,
        currentPrice,
        percentChange,
        yearHigh,
        yearLow,
        recosBar: { averageRating, noOfRecommendations, meanValue },
        riskMeter: { categoryName: riskCategory },
        stockDetailsReusableData: {
            marketCap,
            pPerEBasicExcludingExtraordinaryItemsTTM: peRatio,
            currentDividendYieldCommonStockPrimaryIssueLTM: dividendYield,
            priceYTDPricePercentChange: ytdChange,
        },
        recentNews,
    } = data;

    const topNews = recentNews.slice(0, 3).map(({ headline, date }) => ({
        headline,
        date,
    }));

    return {
        companyName,
        industry,
        currentPrice,
        percentChange,
        yearHigh,
        yearLow,
        analystConsensus: { averageRating, noOfRecommendations, meanValue },
        risk: riskCategory,
        marketCap,
        ytdChange,
        recentNews: topNews,
    };
}

module.exports = {
    cleanAsset,
    cleanGoals,
    cleanDebts,
    cleanFinances,
    cleanProfile,
    extractStockContext,
}