async function runTests() {
    const BASE_URL = 'http://localhost:5000/api/admin';

    try {
        console.log('1. Adding a new Hostel...');
        const hostelRes = await fetch(`${BASE_URL}/hostel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                officialName: 'Layout Test Hostel ' + Date.now(),
                gender: 'Female',
                numberOfFloors: 2
            })
        });
        if (!hostelRes.ok) throw new Error(await hostelRes.text());
        const hostelData = await hostelRes.json();
        const hostelId = hostelData._id;
        console.log('Hostel created:', hostelId);

        console.log('\n2. Designing the Hostel with Common Areas...');
        const designRes = await fetch(`${BASE_URL}/hostel/${hostelId}/design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                floorConfigs: [3, 2], // 3 rooms on floor 1, 2 rooms on floor 2
                commonAreaConfig: {
                    "1": ["Washroom", "Common Room"],
                    "2": ["Washroom", "Study Room"]
                }
            })
        });
        if (!designRes.ok) throw new Error(await designRes.text());
        console.log('Design response:', await designRes.json());

        console.log('\n3. Fetching Hostel Layout...');
        const layoutRes = await fetch(`${BASE_URL}/hostel/${hostelId}/layout`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!layoutRes.ok) throw new Error(await layoutRes.text());
        const layoutData = await layoutRes.json();

        console.log('Layout floor 1 rooms count:', layoutData.layout["1"].rooms.length);
        console.log('Layout floor 1 common areas count:', layoutData.layout["1"].commonAreas.length);
        console.log('Layout floor 2 rooms count:', layoutData.layout["2"].rooms.length);
        console.log('Layout floor 2 common areas count:', layoutData.layout["2"].commonAreas.length);

        const firstCommonAreaId = layoutData.layout["1"].commonAreas[0]._id;

        console.log('\n4. Updating Common Area Assets...');
        const assetRes = await fetch(`${BASE_URL}/common-area/${firstCommonAreaId}/assets`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toilets: { total: 5, working: 4 },
                sinks: { total: 5, working: 5 }
            })
        });
        if (!assetRes.ok) throw new Error(await assetRes.text());
        const assetData = await assetRes.json();
        console.log('Assets Response (toilets):', assetData.assets.toilets);
        console.log('Assets Response (sinks):', assetData.assets.sinks);

        console.log('\nAll tests passed!');
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err.message);
        process.exit(1);
    }
}

runTests();
