package analytics

// CategoryBreakdown untuk Pie Chart
type CategoryBreakdown struct {
	CategoryName string `json:"name"`
	TotalAmount  string `json:"value"` 
}

// MonthlySummary untuk Bar Chart
type MonthlySummary struct {
	Month   string `json:"month"`   
	Income  string `json:"income"`
	Expense string `json:"expense"`
}