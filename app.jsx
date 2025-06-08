    const { useState, useEffect, useRef } = React;

    console.debug("Application initialized. Starting to define utility functions.");

    // Utility function: Convert progress (1-5) to percentage
    const scaleProgress = (progress) => {
        console.debug(`scaleProgress called with progress: ${progress}`);
        return ((progress - 1) / 4) * 100;
    };

    // Utility: Get current timestamp
    const getCurrentTimestamp = () => {
        const timestamp = new Date().toISOString();
        console.debug(`getCurrentTimestamp called. Timestamp: ${timestamp}`);
        return timestamp;
    };

    /***********************************************
     *  ローカルストレージ関連（スナップショット）
     ***********************************************/
    const saveSnapshotFunction = (currentProgress) => {
        console.debug("saveSnapshotFunction called with currentProgress:", currentProgress);
        const userName = localStorage.getItem('current_user') || 'default_user';
        console.debug(`Current user: ${userName}`);
        const snapshotsKey = `snapshots_${userName}`;
        const snapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];

        const newSnapshot = {
            timestamp: getCurrentTimestamp(),
            data: currentProgress
        };
        console.debug("New snapshot to be saved:", newSnapshot);

        snapshots.push(newSnapshot);
        localStorage.setItem(snapshotsKey, JSON.stringify(snapshots));
        console.debug("New snapshot saved successfully.");
    };

    const restoreSnapshot = (snapshotIndex) => {
        console.debug(`restoreSnapshot called with snapshotIndex: ${snapshotIndex}`);
        const userName = localStorage.getItem('current_user') || 'default_user';
        console.debug(`Current user: ${userName}`);
        const snapshotsKey = `snapshots_${userName}`;
        const snapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
        console.debug(`Available snapshots for restoration:`, snapshots);
        const snapshot = snapshots[snapshotIndex];
        if (snapshot) {
            console.debug(`Snapshot found at index ${snapshotIndex}:`, snapshot);
            return snapshot.data;
        }
        console.warn(`No snapshot found at index ${snapshotIndex}.`);
        return null;
    };

    const deleteSnapshot = (snapshotIndex) => {
        console.debug(`deleteSnapshot called with snapshotIndex: ${snapshotIndex}`);
        const userName = localStorage.getItem('current_user') || 'default_user';
        console.debug(`Current user: ${userName}`);
        const snapshotsKey = `snapshots_${userName}`;
        const snapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
        console.debug(`Snapshots before deletion:`, snapshots);
        snapshots.splice(snapshotIndex, 1);
        localStorage.setItem(snapshotsKey, JSON.stringify(snapshots));
        console.debug(`Snapshots after deletion:`, snapshots);
    };

    /***********************************************
     *  エクスポート／インポート関連
     ***********************************************/
    // YAMLエクスポート => "テキストとしてエクスポートする"
    const handleExportYAML = (userName, setExportedYaml, ifFile) => {
        console.debug(`handleExportYAML called with userName: ${userName}`);
        const snapshotsKey = `snapshots_${userName}`;
        const snapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
        console.debug(`Snapshots retrieved for YAML export:`, snapshots);
        const savedSelfEvaluation = localStorage.getItem(`self_evaluation_${userName}`) || '';
        console.debug(`Self-Evaluation retrieved: ${savedSelfEvaluation}`);
        // 最新スナップショットのデータを採用
        const latestSnapshot = snapshots[snapshots.length - 1]?.data || {};
        console.debug("Latest snapshot data:", latestSnapshot);

        // YAMLにしたい構造を作成
        const transformedData = {
            評価: [],
            感想: savedSelfEvaluation
        };
        console.debug("Initial transformedData:", transformedData);

        // window.globalData を利用してカテゴリ・項目名を取り出し
        window.globalData.forEach(category => {
            console.debug(`Processing category: ${category.label}`);
            const categoryData = {};
            const categoryItems = {};

            category.children.forEach(item => {
                const progress = latestSnapshot[`progress-${item.id}`] || 1;
                console.debug(`Processing item: ${item.label}, progress: ${progress}`);
                categoryItems[item.label] = progress;
            });

            categoryData[category.label] = categoryItems;
            transformedData.評価.push(categoryData);
            console.debug(`CategoryData after processing ${category.label}:`, categoryData);
        });

        console.debug("Final transformedData before YAML conversion:", transformedData);

        const yamlStr = jsyaml.dump(transformedData, {
            indent: 2,
            lineWidth: -1,
            noRefs: true
        });
        console.debug("YAML string generated:", yamlStr);

        // ダウンロード
        if(ifFile){
            const blob = new Blob([yamlStr], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'progress_backup.yaml';
            console.debug("Initiating YAML file download.");
            link.click();
        };

        // exportedYamlにセット
        setExportedYaml(yamlStr);
        console.debug("exportedYaml state updated.");
    };

    // JSONインポート
    const handleImportJSON = (file, userName, onImportSuccess) => {
        console.debug(`handleImportJSON called with file:`, file, `userName: ${userName}`);
        const reader = new FileReader();
        reader.onload = (e) => {
            console.debug("FileReader onload triggered.");
            try {
                const importData = JSON.parse(e.target.result);
                console.debug("Parsed importData:", importData);
                if (importData.snapshots) {
                    const snapshotsKey = `snapshots_${userName}`;
                    localStorage.setItem(snapshotsKey, JSON.stringify(importData.snapshots));
                    console.debug(`Snapshots imported and saved under key: ${snapshotsKey}`);
                }
                onImportSuccess();
                console.debug("Import successful. onImportSuccess callback executed.");
            } catch (error) {
                console.error('Import Error:', error);
                alert('インポートに失敗しました。正しいJSONファイルを選択してください。');
            }
        };
        reader.onerror = (error) => {
            console.error('FileReader Error:', error);
            alert('ファイルの読み込み中にエラーが発生しました。');
        };
        reader.readAsText(file);
        console.debug("FileReader readAsText called.");
    };

    /***********************************************
     *  スナップショット一覧コンポーネント
     ***********************************************/
    const SnapshotList = ({ snapshots, onRestore, onDelete }) => {
        console.debug("SnapshotList component rendered with snapshots:", snapshots);
        return (
            <div className="snapshot-list">
                {snapshots.length > 0 ? (
                    <ul>
                        {snapshots.map((snapshot, index) => (
                            <li key={snapshot.timestamp} className="snapshot-item">
                                <span>{new Date(snapshot.timestamp).toLocaleString()}</span>
                                <div>
                                    <button onClick={() => {
                                        console.debug(`Restore button clicked for snapshot index: ${index}`);
                                        onRestore(index);
                                    }}>復元</button>
                                    <button onClick={() => {
                                        console.debug(`Delete button clicked for snapshot index: ${index}`);
                                        onDelete(index);
                                    }}>削除</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>保存されたスナップショットはありません。</p>
                )}
            </div>
        );
    };

    /***********************************************
     *  フィードバック生成コンポーネント
     ***********************************************/
    const FeedbackGeneratorTMP = ({ exportedYaml }) => {
        console.debug("FeedbackGenerator component rendered with exportedYaml:", exportedYaml);
        const [feedbackContent, setFeedbackContent] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [yamlInput, setYamlInput] = useState('');

        useEffect(() => {
            console.debug("あFeedbackGenerator useEffect triggered with exportedYaml:", exportedYaml);
            if (exportedYaml) {
                setYamlInput(exportedYaml);
                generateFeedbackComponent(exportedYaml);
            }
        }, [exportedYaml]);

        const generateFeedbackComponent = async (yamlData) => {
            console.debug("いgenerateFeedback called with yamlData:", yamlData);
            if (yamlData.trim() === "") {
                console.warn("YAML data is empty.");
                setFeedbackContent('<span class="error">YAMLデータを入力してください。</span>');
                return;
            }

            setIsLoading(true);
            setFeedbackContent('うフィードバックを生成中...');
            console.debug("うGenerating feedback...");

            // 外部スクリプトの FeedbackGenerator.createFeedbackFromYAML を使用
            const result = FeedbackGenerator.createFeedbackFromYAML(yamlData);
            console.log(result.feedback);
            console.debug("FeedbackGenerator.createFeedbackFromYAML returned:", result);

            if (result.success) {
                // marked.jsを使用してMarkdownをHTMLに変換
                const htmlContent = marked.parse(result.feedback);
                console.debug("Converted Markdown to HTML:", htmlContent);
                setFeedbackContent(htmlContent);
            } else {
                setFeedbackContent(`<span class="error">${result.message}</span>`);
            }

            setIsLoading(false);
        };

        return (
            <div className="feedback-section">
                <h3>プレゼンテーション評価フィードバック生成ツール</h3>
                {/* YAML入力エリアは表示しない */}
                {/* フィードバック生成ボタンは非表示 */}
                {/* 自動生成されたフィードバックを表示 */}
                <div id="feedbackContent" dangerouslySetInnerHTML={{ __html: feedbackContent }}></div>
                {isLoading && console.debug("Feedback is loading...")}
            </div>
        );
    };

    /***********************************************
     *  ツリー（5段階評価のみ）
     ***********************************************/
    const TreeItem = ({ item, currentProgress, setCurrentProgress, forceAllOpen }) => {
        console.debug(`TreeItem rendered for item: ${item.label} (ID: ${item.id})`);
        const [isOpen, setIsOpen] = useState(false);

        useEffect(() => {
            console.debug(`useEffect for TreeItem ID ${item.id} with forceAllOpen: ${forceAllOpen}`);
            if (forceAllOpen) {
                setIsOpen(true);
            }
        }, [forceAllOpen, item.id]);

        // 子要素を平均して、親要素へ反映したい場合など
        useEffect(() => {
            if (item.children && item.children.length > 0) {
                console.debug(`Calculating average progress for parent item: ${item.label}`);
                const childrenCount = item.children.length;
                let total = 0;
                item.children.forEach(child => {
                    const cp = currentProgress[`progress-${child.id}`] || 1;
                    console.debug(`Child ID ${child.id} progress: ${cp}`);
                    total += cp;
                });
                const average = childrenCount > 0 ? parseFloat((total / childrenCount).toFixed(2)) : 0;
                const existingProgress = currentProgress[`progress-${item.id}`] || 1;
                console.debug(`Calculated average: ${average}, Existing progress: ${existingProgress}`);
                // 更新が必要な場合のみセット
                if (Math.abs(average - existingProgress) > 0.001) {
                    console.debug(`Updating progress for parent item ID ${item.id} to average: ${average}`);
                    setCurrentProgress(prev => ({
                        ...prev,
                        [`progress-${item.id}`]: average
                    }));
                }
            }
        }, [item.children, item.id, currentProgress, setCurrentProgress]);

        const toggleOpen = () => {
            console.debug(`Toggle open state for item ID ${item.id}. Current state: ${isOpen}`);
            setIsOpen(!isOpen);
        };

        const handleStepClick = (step) => {
            console.debug(`handleStepClick called for item ID ${item.id} with step: ${step}`);
            // 子要素がある場合はクリックしても何もしない
            if (item.children && item.children.length > 0) {
                console.debug(`Item ID ${item.id} has children. Click ignored.`);
                return;
            }
            setCurrentProgress(prev => ({
                ...prev,
                [`progress-${item.id}`]: step
            }));
            console.debug(`Progress for item ID ${item.id} set to ${step}`);
        };

        const progressValue = currentProgress[`progress-${item.id}`] || 1;
        console.debug(`Current progress value for item ID ${item.id}: ${progressValue}`);

        return (
            <li>
                <div className="tree-item">
                    {item.children && item.children.length > 0 ? (
                        <button
                            className={`toggle-button ${isOpen ? 'expanded' : ''}`}
                            onClick={() => {
                                console.debug(`Toggle button clicked for item ID ${item.id}`);
                                toggleOpen();
                            }}
                            aria-expanded={isOpen}
                            title={isOpen ? '子項目を折りたたむ' : '子項目を展開する'}
                        >
                            {isOpen ? '▼' : '▶'}
                        </button>
                    ) : <span className="toggle-button"></span>}

                    <span className="item-label">{item.label}</span>

                    {/* 親要素の場合 => プロ */}
                    {item.children && item.children.length > 0 ? (
                        <div className="progress-bar-container" title={`進捗: ${progressValue.toFixed(2)}/5`}>
                            <div
                                className="progress-bar"
                                style={{ width: `${scaleProgress(progressValue)}%` }}
                            ></div>
                            <span className="progress-text">{progressValue.toFixed(2)}/5</span>
                        </div>
                    ) : (
                        /* 5段階評価 */
                        <div className="progress-indicator">
                            {[1, 2, 3, 4, 5].map(step => (
                                <span
                                    key={step}
                                    className={`step ${step <= progressValue ? 'active' : ''}`}
                                    onClick={() => {
                                        console.debug(`Step ${step} clicked for item ID ${item.id}`);
                                        handleStepClick(step);
                                    }}
                                    title={`進捗を${step}に設定`}
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={step <= progressValue}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            console.debug(`Key pressed (${e.key}) on step ${step} for item ID ${item.id}`);
                                            handleStepClick(step);
                                        }
                                    }}
                                >
                                    {step}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 子要素 */}
                {item.children && item.children.length > 0 && isOpen && (
                    <ul className="tree">
                        {item.children.map(child => (
                            <TreeItem
                                key={child.id}
                                item={child}
                                currentProgress={currentProgress}
                                setCurrentProgress={setCurrentProgress}
                                forceAllOpen={forceAllOpen}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    const TreeComponent = ({ data, currentProgress, setCurrentProgress, forceAllOpen }) => {
        console.debug("TreeComponent rendered with data:", data);
        return (
            <ul className="tree">
                {data.map(item => (
                    <TreeItem
                        key={item.id}
                        item={item}
                        currentProgress={currentProgress}
                        setCurrentProgress={setCurrentProgress}
                        forceAllOpen={forceAllOpen}
                    />
                ))}
            </ul>
        );
    };

    /***********************************************
     *  チャート（レーダー）
     ***********************************************/
    const SummaryChartComponent = ({ data, currentProgress }) => {
        console.debug("SummaryChartComponent rendered with data:", data, "and currentProgress:", currentProgress);
        const chartRef = useRef(null);
        const chartInstanceRef = useRef(null);

        useEffect(() => {
            console.debug("SummaryChartComponent useEffect triggered.");
            if (!data || data.length === 0) {
                console.warn("No data available for SummaryChartComponent.");
                return;
            }

            const rootLevelItems = data;
            const labels = rootLevelItems.map(item => item.label);
            console.debug("Radar chart labels:", labels);

            // さらに下の階層がある場合は合計する例
            const getDeepSum = (children) => {
                console.debug("getDeepSum called for children:", children);
                let total = 0;
                children.forEach(child => {
                    const progressVal = currentProgress[`progress-${child.id}`] || 1;
                    console.debug(`Child ID ${child.id} progress: ${progressVal}`);
                    if (child.children && child.children.length > 0) {
                        total += getDeepSum(child.children);
                    } else {
                        total += progressVal;
                    }
                });
                console.debug("Returning total from getDeepSum:", total);
                return total;
            };

            const chartData = rootLevelItems.map(item => {
                if (!item.children || item.children.length === 0) {
                    const p = currentProgress[`progress-${item.id}`] || 1;
                    console.debug(`Item ID ${item.id} has no children. Progress: ${p}`);
                    return p;
                } else {
                    const sum = getDeepSum(item.children);
                    console.debug(`Item ID ${item.id} has children. Sum of progress: ${sum}`);
                    return sum;
                }
            });
            console.debug("Radar chart data:", chartData);

            // 既存チャートを破棄
            if (chartInstanceRef.current) {
                console.debug("Destroying existing radar chart instance.");
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            console.debug("Creating new radar chart instance.");
            chartInstanceRef.current = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Progress Summary',
                        data: chartData,
                        backgroundColor: 'rgba(34, 202, 236, 0.2)',
                        borderColor: 'rgba(34, 202, 236, 1)',
                        pointBackgroundColor: 'rgba(34, 202, 236, 1)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 20, // 適宜調整
                            ticks: {
                                stepSize: 1,
                                backdropColor: 'rgba(255,255,255,0)',
                                color: '#666'
                            },
                            angleLines: {
                                color: '#ccc'
                            },
                            grid: {
                                color: '#ccc'
                            },
                            pointLabels: {
                                font: {
                                    size: 14
                                },
                                color: '#333'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: '進捗サマリー',
                            font: {
                                size: 18
                            }
                        }
                    }
                }
            });
            console.debug("Radar chart instance created successfully.");

            return () => {
                if (chartInstanceRef.current) {
                    console.debug("Cleaning up radar chart instance.");
                    chartInstanceRef.current.destroy();
                }
            };
        }, [data, currentProgress]);

        return (
            <div style={{ width: '80%', height: '400px', margin: '0 auto' }}>
                <canvas ref={chartRef}></canvas>
            </div>
        );
    };

    /***********************************************
     *  スナップショット比較コンポーネント
     *   => 選択されたスナップショットを
     *      1つのレーダーチャートにオーバーレイして表示
     ***********************************************/
    const ComparisonComponent = ({ userName }) => {
        console.debug("ComparisonComponent rendered with userName:", userName);
        const [progressHistory, setProgressHistory] = useState([]);
        // チェックボックスで選択されたスナップショットID（timestamp）
        const [selectedSnapshots, setSelectedSnapshots] = useState([]);
        const [comparisonData, setComparisonData] = useState(null);

        const radarChartRef = useRef(null);
        const radarChartInstanceRef = useRef(null);

        useEffect(() => {
            console.debug("ComparisonComponent useEffect for loading progress history.");
            if (userName) {
                const snapshots = JSON.parse(localStorage.getItem(`snapshots_${userName}`)) || [];
                console.debug(`Loaded snapshots for comparison:`, snapshots);
                setProgressHistory(snapshots);
            }
        }, [userName]);

        // 選択スナップショットが変更されたら比較用データを更新
        useEffect(() => {
            console.debug("ComparisonComponent useEffect for selectedSnapshots change.");
            if (selectedSnapshots.length > 0 && userName) {
                console.debug("Selected snapshots for comparison:", selectedSnapshots);
                const snapshots = JSON.parse(localStorage.getItem(`snapshots_${userName}`)) || [];
                const rootLevelItems = window.globalData || [];
                const labels = rootLevelItems.map(item => item.label);
                console.debug("Comparison radar chart labels:", labels);

                // 合計値を取得する再帰関数
                const getDeepSum = (children, snapshotData) => {
                    console.debug("getDeepSum called for comparison with children:", children);
                    let total = 0;
                    children.forEach(child => {
                        const progressVal = snapshotData[`progress-${child.id}`] || 1;
                        console.debug(`Child ID ${child.id} progress in snapshot: ${progressVal}`);
                        if (child.children && child.children.length > 0) {
                            total += getDeepSum(child.children, snapshotData);
                        } else {
                            total += progressVal;
                        }
                    });
                    console.debug("Returning total from getDeepSum for comparison:", total);
                    return total;
                };

                // datasetsを格納する配列
                const datasets = [];

                // 選択された各スナップショットごとにレーダー用データを作成
                selectedSnapshots.forEach((timestamp, index) => {
                    console.debug(`Processing selected snapshot with timestamp: ${timestamp}`);
                    const snapshotRecord = snapshots.find(record => record.timestamp === timestamp);
                    if (!snapshotRecord) {
                        console.warn(`Snapshot with timestamp ${timestamp} not found.`);
                        return; // 念のため
                    }

                    const snapshotData = snapshotRecord.data || {};
                    const dataForChart = rootLevelItems.map(item => {
                        if (!item.children || item.children.length === 0) {
                            const p = snapshotData[`progress-${item.id}`] || 1;
                            console.debug(`Snapshot data for item ID ${item.id}: ${p}`);
                            return p;
                        } else {
                            const sum = getDeepSum(item.children, snapshotData);
                            console.debug(`Snapshot sum for parent item ID ${item.id}: ${sum}`);
                            return sum;
                        }
                    });
                    console.debug(`Data for chart from snapshot ${timestamp}:`, dataForChart);

                    // データセットごとに色を変える例
                    const colorSet = [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                    ];
                    const chartColor = colorSet[index % colorSet.length] || 'rgba(100,100,100,0.6)';
                    console.debug(`Assigning color ${chartColor} to snapshot ${timestamp}`);

                    datasets.push({
                        label: new Date(timestamp).toLocaleString(),
                        data: dataForChart,
                        backgroundColor: chartColor,
                        borderColor: chartColor.replace('0.6', '1'),
                        pointBackgroundColor: chartColor.replace('0.6', '1'),
                        fill: true,
                    });
                });

                setComparisonData({ labels, datasets });
                console.debug("Comparison data set for radar chart:", { labels, datasets });
            } else {
                console.debug("No snapshots selected for comparison. Clearing comparisonData.");
                setComparisonData(null);
            }
        }, [selectedSnapshots, userName]);

        // comparisonData が変わるたびにレーダーチャートを描画
        useEffect(() => {
            console.debug("ComparisonComponent useEffect for comparisonData change.");
            // 既存チャートの破棄
            if (radarChartInstanceRef.current) {
                console.debug("Destroying existing comparison radar chart instance.");
                radarChartInstanceRef.current.destroy();
            }

            if (comparisonData && comparisonData.datasets && comparisonData.datasets.length > 0) {
                console.debug("Creating new comparison radar chart with data:", comparisonData);
                const ctx = radarChartRef.current.getContext('2d');
                radarChartInstanceRef.current = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: comparisonData.labels,
                        datasets: comparisonData.datasets,
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                min: 0,
                                max: 20,
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top'
                            },
                            title: {
                                display: true,
                                text: 'スナップショット比較'
                            }
                        }
                    }
                });
                console.debug("Comparison radar chart instance created successfully.");
            }
            return () => {
                if (radarChartInstanceRef.current) {
                    console.debug("Cleaning up comparison radar chart instance.");
                    radarChartInstanceRef.current.destroy();
                }
            };
        }, [comparisonData]);

        // チェックボックスのクリック
        const handleCheckboxChange = (timestamp) => {
            console.debug(`Checkbox changed for snapshot timestamp: ${timestamp}`);
            setSelectedSnapshots(prev => {
                if (prev.includes(timestamp)) {
                    console.debug(`Snapshot ${timestamp} is already selected. Removing it.`);
                    return prev.filter(t => t !== timestamp);
                }
                console.debug(`Snapshot ${timestamp} is not selected. Adding it.`);
                return [...prev, timestamp];
            });
        };

        return (
            <div className="comparison-container" style={{ marginTop: '20px' }}>
                <h3>進捗の比較</h3>
                {progressHistory.length > 0 ? (
                    <div>
                        <p>比較したいスナップショットを選択してください（複数可）:</p>
                        <div className="comparison-list">
                            {progressHistory.map((record) => {
                                const recordTime = new Date(record.timestamp).toLocaleString();
                                return (
                                    <div className="comparison-item" key={record.timestamp}>
                                        <input
                                            type="checkbox"
                                            checked={selectedSnapshots.includes(record.timestamp)}
                                            onChange={() => {
                                                console.debug(`Checkbox toggled for snapshot: ${record.timestamp}`);
                                                handleCheckboxChange(record.timestamp);
                                            }}
                                            id={`snapshot-${record.timestamp}`}
                                        />
                                        <label htmlFor={`snapshot-${record.timestamp}`} style={{ marginLeft: '8px' }}>
                                            {recordTime}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 比較結果の表示: レーダーチャートのみ */}
                        {(!comparisonData || !comparisonData.datasets || comparisonData.datasets.length === 0) && (
                            <p style={{ color: 'red', marginTop: '10px' }}>
                                スナップショットを一つ以上選択してください。
                            </p>
                        )}
                        {comparisonData && comparisonData.datasets && comparisonData.datasets.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div className="radar-chart" style={{ marginTop: '20px' }}>
                                    <h4>レーダーチャートによる比較</h4>
                                    <div style={{ width: '80%', height: '400px', margin: '0 auto' }}>
                                        <canvas ref={radarChartRef}></canvas>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>比較するためのスナップショットがありません。</p>
                )}
            </div>
        )};

    /***********************************************
     *  メインアプリ
     ***********************************************/
    const App = () => {
        console.debug("App component initialized.");
        const [data, setData] = useState([]);
        const [showChart, setShowChart] = useState(false);
        const [showComparison, setShowComparison] = useState(false);
        const [userName, setUserName] = useState('default_user');
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [snapshots, setSnapshots] = useState([]);
        const [currentProgress, setCurrentProgress] = useState({});
        const [forceAllOpen, setForceAllOpen] = useState(false);

        // Collapsible states
        const [showExportImport, setShowExportImport] = useState(false);
        const [showSnapshotList, setShowSnapshotList] = useState(false);

        // Self-Evaluation
        const [selfEvaluation, setSelfEvaluation] = useState('');

        // exportedYaml state
        const [exportedYaml, setExportedYaml] = useState('');

        // 初回: localStorageからユーザー名と自己評価を読み込み
        useEffect(() => {
            console.debug("App useEffect: Loading initial userName and selfEvaluation from localStorage.");
            const savedUserName = localStorage.getItem('current_user') || 'default_user';
            console.debug(`Saved userName: ${savedUserName}`);
            setUserName(savedUserName);
            const savedEval = localStorage.getItem(`self_evaluation_${savedUserName}`) || '';
            console.debug(`Saved selfEvaluation for ${savedUserName}: ${savedEval}`);
            setSelfEvaluation(savedEval);
        }, []);

        // ユーザー名が変われば自己評価を保存
        useEffect(() => {
            console.debug(`App useEffect: userName changed to ${userName}. Saving selfEvaluation.`);
            if (userName) {
                localStorage.setItem(`self_evaluation_${userName}`, selfEvaluation);
                console.debug(`Self-Evaluation saved for userName ${userName}.`);
            }
        }, [selfEvaluation, userName]);

        // ユーザー名が変わればスナップショットを読み込み
        useEffect(() => {
            console.debug(`App useEffect: Loading snapshots for userName ${userName}.`);
            if (userName) {
                localStorage.setItem('current_user', userName);
                const snapshotsKey = `snapshots_${userName}`;
                const loadedSnapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
                console.debug(`Loaded snapshots for ${userName}:`, loadedSnapshots);
                setSnapshots(loadedSnapshots);
                if (loadedSnapshots.length > 0) {
                    const latestData = loadedSnapshots[loadedSnapshots.length - 1].data;
                    console.debug("Setting currentProgress to latest snapshot data:", latestData);
                    setCurrentProgress(latestData);
                } else {
                    console.debug("No snapshots found. Resetting currentProgress.");
                    setCurrentProgress({});
                }
            }
        }, [userName]);

        // ダミーデータ読み込み（実際はAPI等から取得）
        useEffect(() => {
            console.debug("App useEffect: Loading mock data.");
            const mockData = [
                {
                    "id": 100,
                    "label": "原稿",
                    "children": [
                        { "id": 101, "label": "わかりやすい英語で書かれているか", "children": [] },
                        { "id": 102, "label": "分かりやすい構成で書かれているか", "children": [] },
                        { "id": 103, "label": "要点をまとめて書かれているか", "children": [] },
                        { "id": 104, "label": "客観的なデータに基づいて書かれているか", "children": [] }
                    ]
                },
                {
                    "id": 105,
                    "label": "話し方",
                    "children": [
                        { "id": 106, "label": "抑揚をつける話しているか", "children": [] },
                        { "id": 107, "label": "はっきりと大きな声で話しているか", "children": [] },
                        { "id": 108, "label": "聞き取りやすい速度で話せているか", "children": [] },
                        { "id": 109, "label": "表情を動かして話しているか", "children": [] }
                    ]
                },
                {
                    "id": 110,
                    "label": "準備",
                    "children": [
                        { "id": 111, "label": "原稿を覚えているか", "children": [] },
                        { "id": 112, "label": "班員と協力できているか", "children": [] },
                        { "id": 113, "label": "計画的にできたか", "children": [] },
                        { "id": 114, "label": "質問内容を考えているか", "children": [] }
                    ]
                },
                {
                    "id": 115,
                    "label": "客のひきつけ",
                    "children": [
                        { "id": 116, "label": "ジョークをいれているか", "children": [] },
                        { "id": 117, "label": "レーザーポインター等を使っているか", "children": [] },
                        { "id": 118, "label": "疑問形で話しかけているか", "children": [] },
                        { "id": 119, "label": "観察とコミュニケーションをとれているか", "children": [] } // 修正済み
                    ]
                },
                {
                    "id": 120,
                    "label": "スライド",
                    "children": [
                        { "id": 121, "label": "分かりやすい英語でまとめられているか", "children": [] },
                        { "id": 122, "label": "表、グラフ等を入れているか", "children": [] },
                        { "id": 123, "label": "言いたいことを強調しているか", "children": [] },
                        { "id": 124, "label": "原稿とリンクしているか", "children": [] }
                    ]
                },
                {
                    "id": 125,
                    "label": "立ち振る舞い",
                    "children": [
                        { "id": 126, "label": "前を向いて話しているか", "children": [] },
                        { "id": 127, "label": "ジェスチャーをしながら話しているか", "children": [] },
                        { "id": 128, "label": "自信を持って話しているか", "children": [] },
                        { "id": 129, "label": "待っている人が壁に寄りかかったりしていない", "children": [] }
                    ]
                }
            ];
            setData(mockData);
            window.globalData = mockData; 
            console.debug("Mock data set and window.globalData assigned.");
            setLoading(false);
            console.debug("Loading complete. Setting loading state to false.");
        }, []);

        /***********************************************
         *  postMessageの受信設定を追加
         ***********************************************/
        useEffect(() => {
            console.debug("App useEffect: Setting up postMessage listener.");

            const handleMessage = (event) => {
                // 任意のオリジンに「google」というテキストが含まれていれば許可
                if (event.origin.toLowerCase().includes("google")) {
                    console.debug(`許可されたオリジンからのメッセージを受信しました: ${event.origin}`);
                    // ここでメッセージを処理します
                    console.log('受信したメッセージ:', event.data);
                    // 必要に応じてstateの更新や他の処理を行います
                    // 例:
                    // if (event.data.type === 'updateProgress') {
                    //     setCurrentProgress(event.data.payload);
                    // }
                } else {
                    console.warn(`未許可のオリジンからのメッセージを受信しました: ${event.origin}`);
                }
            };

            window.addEventListener('message', handleMessage, false);
            console.debug("postMessage listener added.");

            // クリーンアップ
            return () => {
                window.removeEventListener('message', handleMessage, false);
                console.debug("postMessage listener removed.");
            };
        }, []);

        /***********************************************
         *  ボタンなどのハンドラ
         ***********************************************/
        // PDF出力
        const handleExportPDF = () => {
            console.debug("handleExportPDF called.");
            // 全て展開してからPDF出力
            setForceAllOpen(true);
            console.debug("All nodes set to open for PDF export.");
            setTimeout(() => {
                const element = document.querySelector('.tree-container');
                console.debug("Selected tree-container for PDF export:", element);
                // 一時的に埋め込みチャート作成用の要素を追加
                const chartElement = document.createElement('div');
                chartElement.style.width = '80%';
                chartElement.style.height = '400px';
                chartElement.style.margin = '0 auto';
                chartElement.innerHTML = '<canvas id="exportChart"></canvas>';
                element.appendChild(chartElement);
                console.debug("Temporary chart element appended for PDF export.");

                // 合計データを算出
                const rootItems = data;
                const labels = rootItems.map(item => item.label);
                console.debug("Radar chart labels:", labels);

                const getDeepSum = (children) => {
                    console.debug("getDeepSum called for export chart with children:", children);
                    let total = 0;
                    children.forEach(child => {
                        const progressVal = currentProgress[`progress-${child.id}`] || 1;
                        console.debug(`Child ID ${child.id} progress: ${progressVal}`);
                        if (child.children && child.children.length > 0) {
                            total += getDeepSum(child.children);
                        } else {
                            total += progressVal;
                        }
                    });
                    console.debug("Returning total from getDeepSum for export chart:", total);
                    return total;
                };

                const chartData = rootItems.map(item => {
                    if (!item.children || item.children.length === 0) {
                        const p = currentProgress[`progress-${item.id}`] || 1;
                        console.debug(`Export chart: Item ID ${item.id} has no children. Progress: ${p}`);
                        return p;
                    } else {
                        const sum = getDeepSum(item.children);
                        console.debug(`Export chart: Item ID ${item.id} has children. Sum of progress: ${sum}`);
                        return sum;
                    }
                });
                console.debug("Export chart data:", chartData);

                const ctx = document.getElementById('exportChart').getContext('2d');
                console.debug("Creating export radar chart.");
                new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Progress Summary (PDF)',
                            data: chartData,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                min: 0,
                                max: 20,
                                ticks: {
                                    stepSize: 1,
                                    backdropColor: 'rgba(255,255,255,0)',
                                    color: '#666'
                                },
                                angleLines: {
                                    color: '#ccc'
                                },
                                grid: {
                                    color: '#ccc'
                                },
                                pointLabels: {
                                    font: {
                                        size: 14
                                    },
                                    color: '#333'
                                }
                            }
                        }
                    }
                });
                console.debug("Export radar chart created.");

                const opt = {
                    margin: 0.5,
                    filename: 'progress_report.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a3', orientation: 'portrait' }
                };
                console.debug("Starting PDF generation with html2pdf.");
                html2pdf().from(element).set(opt).save().then(() => {
                    console.debug("PDF generation completed. Removing temporary chart element.");
                    element.removeChild(chartElement);
                    setForceAllOpen(false);
                    console.debug("All nodes set to closed after PDF export.");
                }).catch((error) => {
                    console.error("Error during PDF generation:", error);
                });
            }, 500);
        };

        // テキストエクスポート
        const handleExportText = () => {
            console.debug("handleExportText called.");
            handleExportYAML(userName || 'default_user', setExportedYaml, true);
        };

        // JSONインポート
        const handleImportJSONFile = (e) => {
            console.debug("handleImportJSONFile called with event:", e);
            const file = e.target.files[0];
            if (file) {
                console.debug("File selected for import:", file);
                handleImportJSON(file, userName || 'default_user', () => {
                    console.debug("Import success callback triggered.");
                    alert('インポートが完了しました。ページをリロードします。');
                    window.location.reload();
                });
            } else {
                console.warn("No file selected for import.");
            }
        };

        // 全て展開・折りたたみ
        const expandAllNodes = () => {
            console.debug("expandAllNodes called.");
            setForceAllOpen(true);
        };
        const collapseAllNodes = () => {
            console.debug("collapseAllNodes called.");
            setForceAllOpen(false);
        };

        // スナップショット保存 => 保存時にチャートを自動表示
        const saveSnapshot = () => {
            console.debug("saveSnapshot called.");
            handleExportYAML(userName || 'default_user', setExportedYaml, false);
            saveSnapshotFunction(currentProgress);
            const snapshotsKey = `snapshots_${userName}`;
            const loadedSnapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
            console.debug("Loaded snapshots after save:", loadedSnapshots);
            setSnapshots(loadedSnapshots);
            alert('スナップショットが保存されました。');
            // チャートを表示・更新
            setShowChart(true);
            console.debug("ShowChart state set to true.");
        };

        // スナップショット復元
        const restoreSnapshotFunction = (idx) => {
            console.debug(`restoreSnapshotFunction called with index: ${idx}`);
            const data = restoreSnapshot(idx);
            if (data) {
                setCurrentProgress(data);
                console.debug("currentProgress updated after restoration:", data);
                alert('スナップショットが復元されました。');
            } else {
                console.warn("No data returned from restoreSnapshot.");
            }
        };

        // スナップショット削除
        const deleteSnapshotFunction = (idx) => {
            console.debug(`deleteSnapshotFunction called with index: ${idx}`);
            if (confirm('このスナップショットを削除しますか？')) {
                deleteSnapshot(idx);
                const snapshotsKey = `snapshots_${userName}`;
                const loadedSnapshots = JSON.parse(localStorage.getItem(snapshotsKey)) || [];
                console.debug(`Loaded snapshots after deletion:`, loadedSnapshots);
                setSnapshots(loadedSnapshots);
                if (loadedSnapshots.length > 0) {
                    const latestData = loadedSnapshots[loadedSnapshots.length - 1].data;
                    console.debug("Setting currentProgress to latest snapshot data after deletion:", latestData);
                    setCurrentProgress(latestData);
                } else {
                    console.debug("No snapshots left after deletion. Resetting currentProgress.");
                    setCurrentProgress({});
                }
                alert('スナップショットが削除されました。');
            } else {
                console.debug("Deletion canceled by user.");
            }
        };

        // Collapsible toggles
        const toggleExportImport = () => {
            console.debug(`toggleExportImport called. Current state: ${showExportImport}`);
            setShowExportImport(!showExportImport);
        };
        const toggleSnapshotList = () => {
            console.debug(`toggleSnapshotList called. Current state: ${showSnapshotList}`);
            setShowSnapshotList(!showSnapshotList);
        };
        const handleComparisonToggle = () => {
            console.debug(`handleComparisonToggle called. Current state: ${showComparison}`);
            setShowComparison(prev => !prev);
        };

        // ロード中やエラー
        if (loading) {
            console.debug("App is loading...");
            return <div className="tree-container">Loading...</div>;
        }
        if (error) {
            console.error("App encountered an error:", error);
            return <div className="tree-container">Error: {error.message}</div>;
        }

        return (
            <div className="tree-container">
                <h2>ツリー構造のリトラクタブルチェックリスト (5段階評価)</h2>

                {/* 上部コントロール */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ marginRight: '8px' }}>
                        名前:
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => {
                                console.debug(`UserName input changed to: ${e.target.value}`);
                                setUserName(e.target.value);
                            }}
                            placeholder="ユーザー名"
                            style={{ marginLeft: '5px' }}
                        />
                    </label>
                    <button onClick={expandAllNodes}>すべて展開</button>
                    <button onClick={collapseAllNodes}>すべて折りたたむ</button>
                    <button onClick={() => {
                        console.debug("Toggle showChart state.");
                        setShowChart(!showChart);
                    }}>
                        {showChart ? 'チャートを非表示' : 'チャートを表示'}
                    </button>
                    <button onClick={handleComparisonToggle}>
                        {showComparison ? '比較を非表示' : '比較を表示'}
                    </button>
                </div>

                {/* 2つの折りたたみセクションを横に並べるためのコンテナ */}
                <div className="collapsible-sections-row">
                    {/* エクスポート / インポート */}
                    <div className="collapsible-section">
                        <div className="collapsible-header" onClick={toggleExportImport}>
                            {showExportImport ? '▼' : '▶'} エクスポート / インポート
                        </div>
                        <div className={`collapsible-content ${showExportImport ? 'show' : ''}`}>
                            <button onClick={handleExportText}>テキストとしてエクスポートする</button>
                            <button onClick={handleExportPDF}>PDFとしてエクスポート</button>
                            <div style={{ marginTop: '10px' }}>
                                <label
                                    htmlFor="import-json"
                                    style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                >
                                    JSONをインポート
                                </label>
                                <input
                                    type="file"
                                    id="import-json"
                                    accept=".json"
                                    style={{ display: 'none' }}
                                    onChange={handleImportJSONFile}
                                />
                            </div>
                        </div>
                    </div>

                    {/* スナップショット一覧 */}
                    <div className="collapsible-section">
                        <div className="collapsible-header" onClick={toggleSnapshotList}>
                            {showSnapshotList ? '▼' : '▶'} 保存済みスナップショット
                        </div>
                        <div className={`collapsible-content ${showSnapshotList ? 'show' : ''}`}>
                            <SnapshotList
                                snapshots={snapshots}
                                onRestore={restoreSnapshotFunction}
                                onDelete={deleteSnapshotFunction}
                            />
                        </div>
                    </div>
                </div>

                {/* 感想・自己評価エリア */}
                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '10px' }}>感想・自己評価</h3>
                    <textarea
                        value={selfEvaluation}
                        onChange={(e) => {
                            console.debug("Self-Evaluation textarea changed.");
                            setSelfEvaluation(e.target.value);
                        }}
                        placeholder="感想や自己評価を入力してください..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* ツリー本体 (5段階評価) */}
                <TreeComponent
                    data={data}
                    currentProgress={currentProgress}
                    setCurrentProgress={setCurrentProgress}
                    forceAllOpen={forceAllOpen}
                />
                {/* レーダーチャートとフィードバック生成機能 */}
                {showChart && (
                    <div style={{ marginTop: '20px' }}>
                        <SummaryChartComponent data={data} currentProgress={currentProgress} />
                        {/* フィードバック生成機能を表示 */}
                        <FeedbackGeneratorTMP exportedYaml={exportedYaml} />
                    </div>
                )}

                {/* スナップショット比較 (複数のスナップショットを1つのグラフにオーバーレイ) */}
                {showComparison && (
                    <ComparisonComponent userName={userName} />
                )}
                {/* ボタン: スナップショットを保存 => 保存後チャートを自動表示 */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button onClick={saveSnapshot}>スナップショットを保存</button>
                </div>
            </div>
        )};

        ReactDOM.render(<App />, document.getElementById('root'));
        console.debug("App component rendered to #root.");

