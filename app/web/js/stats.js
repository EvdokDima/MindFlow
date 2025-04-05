import { checkAuth, logout } from './auth.js';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : 'https://api-mindeasy.ru';
let statusChart, priorityChart, groupsChart;

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Загрузка и отображение статистики
    await loadStatistics();
});

async function loadStatistics() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/tasks/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки статистики');
        }

        const stats = await response.json();
        renderStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        alert('Не удалось загрузить статистику');
    }
}

function renderStats(stats) {
    // Общая статистика
    document.getElementById('total-tasks').textContent = stats.total_tasks;
    document.getElementById('completed-tasks').textContent = stats.completed_tasks;
    document.getElementById('overdue-tasks').textContent = stats.overdue_tasks;

    // График по статусам
    renderStatusChart(stats.status_distribution);

    // График по приоритетам
    renderPriorityChart(stats.priority_distribution);

    // График по группам
    renderGroupsChart(stats.groups_distribution);
}

function renderStatusChart(data) {
    const ctx = document.getElementById('statusChart').getContext('2d');

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Сделать', 'В работе', 'Выполнено'],
            datasets: [{
                data: [data.todo, data.in_progress, data.done],
                backgroundColor: [
                    '#6366f1', // To Do
                    '#f59e0b', // In Progress
                    '#10b981'  // Done
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderPriorityChart(data) {
    const ctx = document.getElementById('priorityChart').getContext('2d');

    if (priorityChart) {
        priorityChart.destroy();
    }

    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5'],
            datasets: [{
                label: 'Количество задач',
                data: [data.p1, data.p2, data.p3, data.p4, data.p5],
                backgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderGroupsChart(data) {
    const ctx = document.getElementById('groupsChart').getContext('2d');
    const labels = data.map(item => item.group_name || 'Без группы');
    const counts = data.map(item => item.task_count);

    if (groupsChart) {
        groupsChart.destroy();
    }

    groupsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Количество задач',
                data: counts,
                backgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}