async function scan() {
  const url = document.getElementById('url').value;
  const scanType = document.getElementById('scanType').value;
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');

  // Clear previous results and errors
  resultsDiv.innerHTML = '';
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
  loadingDiv.style.display = 'block';

  try {
    // Call the local proxy server
    const response = await fetch('http://localhost:8081/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZAP-Secret': '8bb1c57ce11343100ceb53cfccf9e48373bacce0773b6f91c11e20a8f0f992a'
      },
      body: JSON.stringify({ url, scanType })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to start scan: ${response.status}`);
    }

    const data = await response.json();
    console.log('Scan response:', data);

    if (!data || !data.alerts) {
      throw new Error('Invalid response format from scan');
    }

    displayResults(data);
  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  } finally {
    loadingDiv.style.display = 'none';
  }
}

function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (data.error) {
    document.getElementById('error').textContent = data.error;
    document.getElementById('error').style.display = 'block';
    return;
  }

  if (!data.alerts || data.alerts.length === 0) {
    resultsDiv.innerHTML = '<p>No vulnerabilities found!</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'results-table';

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Alert', 'Risk', 'Confidence', 'Description', 'Solution'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  data.alerts.forEach(alert => {
    const row = document.createElement('tr');
    [alert.name, alert.risk, alert.confidence, alert.description, alert.solution].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text || 'N/A';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  resultsDiv.appendChild(table);
} 