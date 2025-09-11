document.addEventListener('DOMContentLoaded', () => {
    const inputValue = document.getElementById('input-value');
    const fromUnit = document.getElementById('from-unit');
    const toUnit = document.getElementById('to-unit');
    const outputValue = document.getElementById('output-value');
    const convertBtn = document.getElementById('convert-btn');

    const conversionRates = {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.34,
        yd: 0.9144,
        ft: 0.3048,
        in: 0.0254,
    };

    convertBtn.addEventListener('click', () => {
        const from = fromUnit.value;
        const to = toUnit.value;
        const value = parseFloat(inputValue.value);

        if (isNaN(value)) {
            alert('Please enter a valid number');
            return;
        }

        const valueInMeters = value * conversionRates[from];
        const convertedValue = valueInMeters / conversionRates[to];

        outputValue.value = convertedValue.toFixed(4);
    });
});