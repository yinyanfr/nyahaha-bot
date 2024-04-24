import dayjs from 'dayjs';

function analyseExpensesSimple(
  expenses: Expense[],
  budget: number = 0,
  utc = 8,
) {
  const today = dayjs().utcOffset(utc);
  const daily = expenses
    .filter(e => dayjs(e.localTime).utcOffset(utc).isSame(today, 'day'))
    .map(e => e.amount)
    .reduce((a, b) => a + b, 0);
  const total = expenses.map(e => e.amount).reduce((a, b) => a + b, 0);
  const remainingDays = today.daysInMonth() - today.date() + 1;
  const remainingBudget = budget - total;
  const remainingDaily =
    remainingBudget > 0 ? remainingBudget / remainingDays : 0;

  return {
    daily: daily.toFixed(2),
    total: total.toFixed(2),
    remainingDays,
    remainingBudget: remainingBudget.toFixed(2),
    remainingDaily: remainingDaily.toFixed(2),
  };
}

export function formatSimpleBudget(
  nickname: string,
  expenses: Expense[],
  budget: number = 0,
  utc = 8,
) {
  const { daily, total, remainingDays, remainingBudget, remainingDaily } =
    analyseExpensesSimple(expenses, budget, utc);
  return `${nickname}今天花了${daily}，本月已花${total}，${
    budget
      ? `${nickname}的预算还剩${remainingBudget}，本月剩余${remainingDays}天，剩余日均${remainingDaily}`
      : `${nickname}尚未设置预算，可通过「预算」命令进行设置`
  }。`;
}

function analyseExpensesComplex(expenses: Expense[]) {
  const total = expenses.map(e => e.amount).reduce((a, b) => a + b, 0);
  const categorized: Record<string, number> = {};
  expenses.forEach(({ category, amount }) => {
    if (categorized[category]) {
      categorized[category] += amount;
    } else {
      categorized[category] = amount;
    }
  });
  const sorted = Object.keys(categorized).map(key => ({
    category: key,
    amount: categorized[key],
    ratio: categorized[key] / total,
  }));
  sorted.sort((a, b) => b.amount - a.amount);
  return { sorted };
}

export function formatComplexBudget(nickname: string, expenses: Expense[]) {
  const { sorted } = analyseExpensesComplex(expenses);
  const formatted = sorted.map(
    ({ category, amount, ratio }) =>
      `${category}: ${amount.toFixed(2)} (${(ratio * 100).toFixed(0)}%)`,
  );
  return formatted.join('\n');
}
