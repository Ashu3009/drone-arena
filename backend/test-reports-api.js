// Test script to simulate frontend ReportsViewer API calls
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testReportsFlow() {
  try {
    console.log('=== Step 1: Login ===');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    console.log('\n=== Step 2: Fetch Matches ===');
    const matchesResponse = await axios.get(`${API_URL}/matches`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('API Response structure:', {
      success: matchesResponse.data.success,
      count: matchesResponse.data.count,
      hasData: !!matchesResponse.data.data,
      isArray: Array.isArray(matchesResponse.data.data)
    });

    // Simulate frontend parsing logic
    const allMatches = Array.isArray(matchesResponse.data)
      ? matchesResponse.data
      : (matchesResponse.data.data || []);

    console.log('After parsing - allMatches length:', allMatches.length);

    if (allMatches.length > 0) {
      console.log('First match:', {
        id: allMatches[0]._id,
        status: allMatches[0].status,
        teamA: allMatches[0].teamA?.name,
        teamB: allMatches[0].teamB?.name,
        roundsCount: allMatches[0].rounds?.length,
        roundStatuses: allMatches[0].rounds?.map(r => r.status)
      });
    }

    // Simulate filter logic
    const matchesWithData = allMatches.filter(m =>
      m.status === 'completed' ||
      (m.rounds && m.rounds.some(r => r.status === 'completed'))
    );

    console.log('\n=== Step 3: Filter Results ===');
    console.log('Filtered matches count:', matchesWithData.length);

    if (matchesWithData.length === 0) {
      console.log('❌ NO MATCHES PASSED FILTER!');
      console.log('This is why frontend shows "No completed matches yet"');
    } else {
      console.log('✅ Matches found:', matchesWithData.length);

      // Test analysis API
      const matchId = matchesWithData[0]._id;
      const roundNumber = 1;

      console.log('\n=== Step 4: Fetch Analysis ===');
      const analysisResponse = await axios.get(
        `${API_URL}/analysis/round/${matchId}/${roundNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Analysis reports count:', analysisResponse.data.reports.length);
      console.log('Drone statuses:', analysisResponse.data.reports.map(r => ({
        droneId: r.droneId,
        status: r.status,
        role: r.role
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReportsFlow();
