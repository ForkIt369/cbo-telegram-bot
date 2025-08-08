// Analytics Functions

let analyticsData = null;

// Load analytics data
async function loadAnalytics(timeRange = '24h') {
    try {
        // Get stats
        const stats = await analyticsAPI.getStats(timeRange);
        updateAnalyticsStats(stats);
        
        // Get flow distribution
        const flows = await analyticsAPI.getFlowDistribution(timeRange);
        updateFlowChart(flows);
        
        analyticsData = { stats, flows };
        
    } catch (error) {
        console.error('Failed to load analytics:', error);
        // Use mock data for now
        useMockAnalytics();
    }
}

// Update analytics statistics
function updateAnalyticsStats(stats) {
    setFieldValue('totalQueries', stats?.total_queries || 0);
    setFieldValue('activeUsers', stats?.active_users || 0);
    setFieldValue('avgResponse', stats?.avg_response_time ? `${stats.avg_response_time}ms` : '0ms');
    setFieldValue('successRate', stats?.success_rate ? `${stats.success_rate}%` : '100%');
}

// Update flow distribution chart
function updateFlowChart(flows) {
    if (!flows) return;
    
    const total = Object.values(flows).reduce((sum, val) => sum + val, 0);
    if (total === 0) return;
    
    // Calculate percentages
    const percentages = {
        value: Math.round((flows.value || 0) / total * 100),
        info: Math.round((flows.info || 0) / total * 100),
        work: Math.round((flows.work || 0) / total * 100),
        cash: Math.round((flows.cash || 0) / total * 100)
    };
    
    // Update flow bars
    const flowChart = document.querySelector('.flow-chart');
    if (flowChart) {
        flowChart.innerHTML = `
            <div class="flow-bar value-flow" style="width: ${percentages.value}%">
                <span>Value: ${percentages.value}%</span>
            </div>
            <div class="flow-bar info-flow" style="width: ${percentages.info}%">
                <span>Info: ${percentages.info}%</span>
            </div>
            <div class="flow-bar work-flow" style="width: ${percentages.work}%">
                <span>Work: ${percentages.work}%</span>
            </div>
            <div class="flow-bar cash-flow" style="width: ${percentages.cash}%">
                <span>Cash: ${percentages.cash}%</span>
            </div>
        `;
    }
}

// Use mock analytics data (for development)
function useMockAnalytics() {
    const mockStats = {
        total_queries: 1247,
        active_users: 42,
        avg_response_time: 850,
        success_rate: 98.5
    };
    
    const mockFlows = {
        value: 312,
        info: 374,
        work: 249,
        cash: 312
    };
    
    updateAnalyticsStats(mockStats);
    updateFlowChart(mockFlows);
    
    analyticsData = { stats: mockStats, flows: mockFlows };
}

// Export analytics report
function exportAnalytics() {
    if (!analyticsData) {
        showNotification('No analytics data available', 'warning');
        return;
    }
    
    const report = {
        generated_at: new Date().toISOString(),
        time_range: document.getElementById('timeRange')?.value || '24h',
        statistics: analyticsData.stats,
        flow_distribution: analyticsData.flows
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const fileName = `cbo-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
    
    showNotification('Analytics report exported', 'success');
}

// Refresh analytics
function refreshAnalytics() {
    const timeRange = document.getElementById('timeRange')?.value || '24h';
    loadAnalytics(timeRange);
    showNotification('Analytics refreshed', 'success');
}

// Initialize analytics on page load
document.addEventListener('DOMContentLoaded', () => {
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (e) => {
            loadAnalytics(e.target.value);
        });
    }
});