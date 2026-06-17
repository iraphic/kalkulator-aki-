// Konstanta untuk perhitungan finansial
const WACC = 0.15; // 15%
const TAX_RATE = 0.22; // 22%
const BAD_DEBT_RATE = 0.05; // 5%
const MARKETING_RATE = 0.30; // 30%
const OPERATIONAL_RATE = 0.20; // 20%
const CAPEX_ADDITIONAL = 0.007; // 0.70% untuk biaya tak terduga

// Fungsi utilitas untuk format mata uang
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

// Fungsi untuk parse currency
function parseCurrency(value) {
    if (typeof value === 'number') return value;
    const parsed = parseInt(value.toString().replace(/[^\d]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}

// Fungsi untuk format persentase
function formatPercentage(value) {
    return (value * 100).toFixed(2) + '%';
}

// Fungsi untuk format angka biasa
function formatNumber(value) {
    return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

// Fungsi hitung NPV
function calculateNPV(cashFlows, discountRate) {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
        npv += cashFlows[i] / Math.pow(1 + discountRate, i);
    }
    return npv;
}

// Fungsi hitung IRR menggunakan Newton-Raphson
function calculateIRR(cashFlows) {
    let rate = 0.1;
    const maxIterations = 100;
    const precision = 1e-6;

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;

        for (let j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + rate, j);
            dnpv += -j * cashFlows[j] / Math.pow(1 + rate, j + 1);
        }

        const newRate = rate - npv / dnpv;
        if (Math.abs(newRate - rate) < precision) {
            return newRate;
        }
        rate = newRate;
    }

    return rate;
}

// Fungsi hitung Payback Period
function calculatePaybackPeriod(cashFlowProjections) {
    let cumulativeCashFlow = 0;
    let paybackYear = 0;
    let paybackMonth = 0;
    let paybackMonths = 0;

    for (const projection of cashFlowProjections) {
        cumulativeCashFlow += projection.netCashFlow;
        if (cumulativeCashFlow >= 0) {
            paybackYear = projection.year;
            const monthlyInflow = projection.netCashFlow / 12;
            if (monthlyInflow > 0) {
                const lastMonthlyNegative = -cumulativeCashFlow + projection.netCashFlow;
                paybackMonth = Math.ceil(lastMonthlyNegative / monthlyInflow);
                paybackMonths = (paybackYear - 1) * 12 + paybackMonth;
            }
            break;
        }
    }

    return { paybackYear, paybackMonth, paybackMonths };
}

// Fungsi hitung analisis finansial
function calculateFinancialAnalysis(inputs) {
    const { customerName, investmentCost, contractPeriod, services } = inputs;

    // Hitung revenue
    let totalOTCRevenue = 0;
    let totalMonthlyRevenue = 0;
    let totalOTCCogs = 0;
    let totalMonthlyCogs = 0;

    services.forEach(service => {
        const monthlyRevenue = parseCurrency(service.monthlyRevenue) || 0;
        const otcCost = parseCurrency(service.otcCost) || 0;
        const quantity = parseInt(service.quantity) || 1;

        totalMonthlyRevenue += monthlyRevenue * quantity;
        totalOTCRevenue += otcCost * quantity;

        // COGS adalah 70% dari revenue
        totalOTCCogs += otcCost * quantity * 0.7;
        totalMonthlyCogs += monthlyRevenue * quantity * 0.7;
    });

    const totalMonthlyRevenueContract = totalMonthlyRevenue * contractPeriod;
    const totalRevenue = totalOTCRevenue + totalMonthlyRevenueContract;
    const totalCogs = totalOTCCogs + totalMonthlyCogs * contractPeriod;

    // Hitung proyeksi per tahun
    const capexInvestment = parseCurrency(investmentCost) || 0;
    const depreciationPeriod = Math.min(contractPeriod, 5);

    const yearlyProjections = [];
    const cogsProjections = [];
    const opexProjections = [];
    const cashFlowProjections = [];

    // Year 0 (tahun investasi)
    const cashFlows = [-capexInvestment];

    for (let year = 0; year <= 6; year++) {
        let yearRevenue = 0;
        let yearCogs = 0;
        let yearBadDebt = 0;
        let yearOpex = 0;
        let yearDepreciation = 0;

        if (year === 0) {
            // Tahun 0 - tahun investasi, tidak ada revenue
            yearRevenue = 0;
            yearCogs = 0;
            yearBadDebt = 0;
            yearOpex = 0;
        } else if (year <= contractPeriod) {
            yearRevenue = totalMonthlyRevenue * 12 + totalOTCRevenue;
            yearCogs = totalMonthlyCogs * 12 + totalOTCCogs;
            yearBadDebt = yearRevenue * BAD_DEBT_RATE;

            const marketingCost = yearRevenue * MARKETING_RATE;
            const operationalCost = yearRevenue * OPERATIONAL_RATE;
            yearOpex = marketingCost + operationalCost;
        }

        if (year > 0) {
            yearDepreciation = capexInvestment / depreciationPeriod;
        }

        const ebitda = yearRevenue - yearCogs - yearBadDebt - yearOpex;
        const ebit = ebitda - yearDepreciation;
        const tax = ebit > 0 ? ebit * TAX_RATE : 0;
        const netIncome = ebit - tax;

        yearlyProjections.push({
            year,
            revenue: yearRevenue,
            cogs: yearCogs,
            badDebt: yearBadDebt,
            opex: yearOpex,
            ebitda,
            depreciation: yearDepreciation,
            ebit,
            tax,
            netIncome,
        });

        // COGS projection
        if (year === 0) {
            cogsProjections.push({ year, otcCogs: 0, monthlyCogs: 0, totalCogs: 0 });
        } else if (year <= contractPeriod) {
            cogsProjections.push({
                year,
                otcCogs: totalOTCCogs,
                monthlyCogs: totalMonthlyCogs * 12,
                totalCogs: totalOTCCogs + totalMonthlyCogs * 12,
            });
        } else {
            cogsProjections.push({ year, otcCogs: 0, monthlyCogs: 0, totalCogs: 0 });
        }

        // OPEX projection
        let marketingOpex = 0;
        let operationalOpex = 0;
        if (year > 0 && year <= contractPeriod) {
            marketingOpex = (totalMonthlyRevenue * 12 + totalOTCRevenue) * MARKETING_RATE;
            operationalOpex = (totalMonthlyRevenue * 12 + totalOTCRevenue) * OPERATIONAL_RATE;
        }

        opexProjections.push({
            year,
            marketingCost: marketingOpex,
            operationalCost: operationalOpex,
            totalOpex: marketingOpex + operationalOpex,
        });

        // Cash flow
        if (year === 0) {
            cashFlowProjections.push({
                year,
                netIncome: 0,
                addBackDepreciation: 0,
                totalCashInflow: 0,
                capex: capexInvestment,
                netCashFlow: -capexInvestment,
                cumulativeCashFlow: -capexInvestment,
            });
        } else {
            const cashInflow = netIncome + yearDepreciation;
            const capexYear = year === 1 ? capexInvestment * CAPEX_ADDITIONAL : 0;
            const netCashFlow = cashInflow - capexYear;
            const prevCumulative = cashFlowProjections[cashFlowProjections.length - 1].cumulativeCashFlow;
            const cumulativeCashFlow = prevCumulative + netCashFlow;

            cashFlowProjections.push({
                year,
                netIncome,
                addBackDepreciation: yearDepreciation,
                totalCashInflow: cashInflow,
                capex: capexYear,
                netCashFlow,
                cumulativeCashFlow,
            });

            if (year <= 6) {
                cashFlows.push(netCashFlow);
            }
        }
    }

    // Hitung NPV dan IRR
    const npv = calculateNPV(cashFlows, WACC);
    const irr = calculateIRR(cashFlows);
    const paybackPeriod = calculatePaybackPeriod(cashFlowProjections);

    // C2R Ratio
    const c2rRatio = capexInvestment / totalRevenue;

    // Feasibility
    const isViable = npv > 0 && irr > WACC;

    return {
        summary: {
            customerName,
            investmentCost: capexInvestment,
            contractPeriod,
            totalRevenue,
            totalCogs,
            totalGrossProfit: totalRevenue - totalCogs,
            totalGrossProfitMargin: (totalRevenue - totalCogs) / totalRevenue,
            c2rRatio,
            isViable,
        },
        yearlyProjections,
        cogsProjections,
        opexProjections,
        cashFlowProjections,
        npv,
        irr,
        paybackPeriod,
    };
}

// WITEL Profiles untuk signature
const WITEL_PROFILES = {
    'Jakarta Centrum': {
        dibuat: { name: 'WITEL JAKARTA PUSAT', pic: 'Manager', date: '' },
        diperiksa: { name: 'SOLUTION & OFFERING', pic: 'Reviewer', date: '' },
        disetujui: { name: 'KEPALA WITEL', pic: 'Head', date: '' },
    },
    'Jakarta Inner': {
        dibuat: { name: 'WITEL JAKARTA DALAM', pic: 'Manager', date: '' },
        diperiksa: { name: 'SOLUTION & OFFERING', pic: 'Reviewer', date: '' },
        disetujui: { name: 'KEPALA WITEL', pic: 'Head', date: '' },
    },
    'Jakarta Outer': {
        dibuat: { name: 'WITEL JAKARTA LUAR', pic: 'Manager', date: '' },
        diperiksa: { name: 'SOLUTION & OFFERING', pic: 'Reviewer', date: '' },
        disetujui: { name: 'KEPALA WITEL', pic: 'Head', date: '' },
    },
    'Banten': {
        dibuat: { name: 'WITEL BANTEN', pic: 'Manager', date: '' },
        diperiksa: { name: 'SOLUTION & OFFERING', pic: 'Reviewer', date: '' },
        disetujui: { name: 'KEPALA WITEL', pic: 'Head', date: '' },
    },
};

// Main React Component
const FinancialAnalysis = () => {
    const [inputs, setInputs] = React.useState({
        customerName: '',
        investmentCost: '',
        contractPeriod: 5,
        services: [{ id: 1, serviceType: '', serviceDetails: '', monthlyRevenue: '', otcCost: '', bandwidth: '', quantity: '1', unit: 'unit' }],
    });

    const [inputValues, setInputValues] = React.useState({ ...inputs, investmentCost: '' });
    const [results, setResults] = React.useState(null);
    const [showFixedParams, setShowFixedParams] = React.useState(false);
    const [showBeritaAcara, setShowBeritaAcara] = React.useState(false);
    const [showApprovalForm, setShowApprovalForm] = React.useState(false);
    const [periodType, setPeriodType] = React.useState('fixed');
    const [customPeriod, setCustomPeriod] = React.useState(5);

    const [approvalForm, setApprovalForm] = React.useState({
        dibuat: [],
        diperiksa: '',
        disetujui: 'AJI WIDYO UTOMO - MGR SOLUTION & OFFERING',
    });

    const [programForm, setProgramForm] = React.useState({
        idProposal: '',
        jumlahLop: '',
        idLop: '',
        idIhld: '',
        lokasiProgram: '',
        koordinatLintang: '',
        koordinatBujur: '',
        namaProgram: '',
    });

    const [beritaAcaraForm, setBeritaAcaraForm] = React.useState({
        customerName: '',
        picName: '',
        picTitle: '',
        picIdNumber: '',
        picAddress: '',
        picContact: '',
    });

    const handleInputChange = (field, value) => {
        setInputs(prev => ({ ...prev, [field]: value }));
        setInputValues(prev => ({ ...prev, [field]: value }));
    };

    const handleServiceChange = (id, field, value) => {
        setInputs(prev => ({
            ...prev,
            services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s),
        }));
    };

    const addService = () => {
        const newId = Math.max(...inputs.services.map(s => s.id), 0) + 1;
        setInputs(prev => ({
            ...prev,
            services: [...prev.services, { id: newId, serviceType: '', serviceDetails: '', monthlyRevenue: '', otcCost: '', bandwidth: '', quantity: '1', unit: 'unit' }],
        }));
    };

    const removeService = (id) => {
        setInputs(prev => ({
            ...prev,
            services: prev.services.filter(s => s.id !== id),
        }));
    };

    const handleCalculate = () => {
        const finalInputs = {
            customerName: inputs.customerName,
            investmentCost: inputs.investmentCost,
            contractPeriod: periodType === 'fixed' ? customPeriod : parseInt(inputs.contractPeriod),
            services: inputs.services,
        };
        const analysis = calculateFinancialAnalysis(finalInputs);
        setResults(analysis);
    };

    const fillDummyData = () => {
        setInputs({
            customerName: 'PT. Telkom Regional',
            investmentCost: '500000000',
            contractPeriod: 5,
            services: [
                { id: 1, serviceType: 'Internet', serviceDetails: 'Bandwidth 100 Mbps', monthlyRevenue: '50000000', otcCost: '25000000', bandwidth: '100', quantity: '1', unit: 'Mbps' },
                { id: 2, serviceType: 'Leased Line', serviceDetails: 'Dedicated 50 Mbps', monthlyRevenue: '30000000', otcCost: '15000000', bandwidth: '50', quantity: '1', unit: 'Mbps' },
            ],
        });
    };

    const exportToPDF = () => {
        if (!results) return;
        alert('PDF Export functionality requires jsPDF library. Please integrate jsPDF for PDF export.');
    };

    const exportToExcel = () => {
        if (!results) return;
        alert('Excel Export functionality requires XLSX library. Please integrate XLSX for Excel export.');
    };

    const generateBeritaAcara = () => {
        if (!results) return;
        alert('Berita Acara generation requires DOCX library. Please integrate DOCX for document generation.');
    };

    const versionInfo = window.versionInfo || { version: '1.1.6.6', lastUpdated: new Date().toISOString() };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ textAlign: 'center', color: '#1e40af', marginBottom: '0.5rem' }}>AKICalc - Analisis Kelayakan Investasi</h1>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Version {versionInfo.version} • Updated {new Date(versionInfo.lastUpdated).toLocaleString('id-ID')}
                </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e3a8a' }}>Input Data Investasi</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Nama Customer:</label>
                    <input
                        type="text"
                        value={inputs.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                        placeholder="Masukkan nama customer"
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Biaya Investasi (CAPEX):</label>
                    <input
                        type="text"
                        value={inputValues.investmentCost}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            setInputs(prev => ({ ...prev, investmentCost: value }));
                            setInputValues(prev => ({ ...prev, investmentCost: value ? formatCurrency(parseInt(value)) : '' }));
                        }}
                        onBlur={() => {
                            if (inputs.investmentCost) {
                                setInputValues(prev => ({ ...prev, investmentCost: formatCurrency(parseInt(inputs.investmentCost)) }));
                            }
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                        placeholder="Rp 0"
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Masa Kontrak:</label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="radio"
                                value="fixed"
                                checked={periodType === 'fixed'}
                                onChange={(e) => setPeriodType(e.target.value)}
                            />
                            Periode Tetap
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="radio"
                                value="custom"
                                checked={periodType === 'custom'}
                                onChange={(e) => setPeriodType(e.target.value)}
                            />
                            Periode Kustom
                        </label>
                    </div>
                    {periodType === 'fixed' ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Pilih periode (tahun):</label>
                            <select
                                value={customPeriod}
                                onChange={(e) => setCustomPeriod(parseInt(e.target.value))}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => <option key={y} value={y}>{y} tahun</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Masukkan periode (tahun):</label>
                            <input
                                type="number"
                                value={inputs.contractPeriod}
                                onChange={(e) => handleInputChange('contractPeriod', Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            />
                        </div>
                    )}
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e3a8a' }}>Layanan (Services):</h3>
                {inputs.services.map((service, idx) => (
                    <div key={service.id} style={{ backgroundColor: '#fff', padding: '1rem', marginBottom: '1rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>Tipe Layanan:</label>
                                <input
                                    type="text"
                                    value={service.serviceType}
                                    onChange={(e) => handleServiceChange(service.id, 'serviceType', e.target.value)}
                                    placeholder="Internet, Leased Line, etc"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>Detail Layanan:</label>
                                <input
                                    type="text"
                                    value={service.serviceDetails}
                                    onChange={(e) => handleServiceChange(service.id, 'serviceDetails', e.target.value)}
                                    placeholder="Spesifikasi teknis"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>Revenue Bulanan:</label>
                                <input
                                    type="text"
                                    value={service.monthlyRevenue}
                                    onChange={(e) => handleServiceChange(service.id, 'monthlyRevenue', e.target.value.replace(/[^\d]/g, ''))}
                                    placeholder="Rp 0"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>Biaya OTC:</label>
                                <input
                                    type="text"
                                    value={service.otcCost}
                                    onChange={(e) => handleServiceChange(service.id, 'otcCost', e.target.value.replace(/[^\d]/g, ''))}
                                    placeholder="Rp 0"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>Kuantitas:</label>
                                <input
                                    type="number"
                                    value={service.quantity}
                                    onChange={(e) => handleServiceChange(service.id, 'quantity', e.target.value)}
                                    min="1"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>
                        {inputs.services.length > 1 && (
                            <button
                                onClick={() => removeService(service.id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Hapus Layanan
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={addService}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        marginBottom: '1.5rem',
                    }}
                >
                    + Tambah Layanan
                </button>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleCalculate}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                        }}
                    >
                        Hitung Analisis
                    </button>
                    <button
                        onClick={fillDummyData}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                        }}
                    >
                        Isi Dummy
                    </button>
                </div>
            </div>

            {results && (
                <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e3a8a' }}>Hasil Analisis</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Total Revenue</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(results.summary.totalRevenue)}</div>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>NPV @ 15% WACC</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: results.npv > 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(results.npv)}</div>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>IRR</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: results.irr > WACC ? '#10b981' : '#ef4444' }}>{formatPercentage(results.irr)}</div>
                        </div>
                        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Payback Period</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{results.paybackPeriod.paybackYear} tahun {results.paybackPeriod.paybackMonth} bulan</div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '2px solid', borderColor: results.summary.isViable ? '#10b981' : '#ef4444', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: results.summary.isViable ? '#10b981' : '#ef4444', marginBottom: '1rem' }}>
                            Status: {results.summary.isViable ? '✓ LAYAK' : '✗ TIDAK LAYAK'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            <p>• C2R Ratio: {(results.summary.c2rRatio * 100).toFixed(2)}% (Maksimal 31%)</p>
                            <p>• Gross Profit Margin: {formatPercentage(results.summary.totalGrossProfitMargin)}</p>
                            <p>• Feasibility Criteria: NPV {'>'} 0 AND IRR {'>'} WACC (15%)</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                            onClick={exportToPDF}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                            }}
                        >
                            📄 Export PDF
                        </button>
                        <button
                            onClick={exportToExcel}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                            }}
                        >
                            📊 Export Excel
                        </button>
                        <button
                            onClick={generateBeritaAcara}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                            }}
                        >
                            📝 Berita Acara
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Render aplikasi
window._appRoot.render(<FinancialAnalysis />);
