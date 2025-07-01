
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ProcessEvent, AlertNotification, ProcessAnalysis, NavigationPath } from '../types';
import { geminiService } from '../services/geminiService';
import { calculateProcessMetrics, formatDuration, ProcessMetrics } from '../utils/processUtils';
import { LightBulbIcon, DocumentMagnifyingGlassIcon, ChartBarIcon, UsersIcon, ClockIcon, ArrowsRightLeftIcon, LinkIcon as LinkChainIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface ProcessAnalyzerPageProps {
  processData: ProcessEvent[] | null;
  addAlert: (type: AlertNotification['type'], message: string) => void;
}

const ProcessGraphSVG: React.FC<{ metrics: ProcessMetrics | null; maxNodes?: number }> = ({ metrics, maxNodes = 20 }) => {
  if (!metrics || metrics.dfg.nodes.length === 0) {
    return <p className="text-gray-400 text-center py-4">No process flow data to visualize.</p>;
  }

  const { nodes: allNodes, edges } = metrics.dfg;
  
  const displayNodes = allNodes.length > maxNodes 
    ? [...allNodes].sort((a,b) => b.count - a.count).slice(0, maxNodes) 
    : allNodes;
  const displayNodeIds = new Set(displayNodes.map(n => n.id));
  const displayEdges = edges.filter(edge => displayNodeIds.has(edge.source) && displayNodeIds.has(edge.target));

  const nodeWidth = 140;
  const nodeHeight = 70;
  const gapX = 60;
  const gapY = 50;
  const paddingX = 40;
  const paddingY = 40;

  // Determine grid columns - aim for a roughly square layout, or max 5 columns
  const numNodes = displayNodes.length;
  const idealCols = Math.min(5, Math.ceil(Math.sqrt(numNodes)));
  const numCols = numNodes <= 3 ? numNodes : idealCols; // For few nodes, lay them horizontally
  const numRows = Math.ceil(numNodes / numCols);


  const svgWidth = numCols * (nodeWidth + gapX) - gapX + 2 * paddingX;
  const svgHeight = numRows * (nodeHeight + gapY) - gapY + 2 * paddingY;


  const nodePositions = new Map<string, { x: number; y: number; cx: number; cy: number }>();
  displayNodes.forEach((node, i) => {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = paddingX + col * (nodeWidth + gapX);
    const y = paddingY + row * (nodeHeight + gapY);
    nodePositions.set(node.id, {
      x,
      y,
      cx: x + nodeWidth / 2, // center x
      cy: y + nodeHeight / 2, // center y
    });
  });
  
  // Function to find intersection point of a line and a rectangle
  const getRectIntersectionPoint = (rectX: number, rectY: number, rectW: number, rectH: number, lineX1:number, lineY1:number, lineX2:number, lineY2:number) => {
    const halfW = rectW / 2;
    const halfH = rectH / 2;
    const cx = rectX + halfW;
    const cy = rectY + halfH;

    const dx = lineX2 - lineX1;
    const dy = lineY2 - lineY1;

    if (dx === 0 && dy === 0) return {x: cx, y: cy}; // Points are identical

    const tValues = [];
    if (dx !== 0) { // Check intersection with vertical sides
      tValues.push((cx - halfW - lineX1) / dx); // Left
      tValues.push((cx + halfW - lineX1) / dx); // Right
    }
    if (dy !== 0) { // Check intersection with horizontal sides
      tValues.push((cy - halfH - lineY1) / dy); // Top
      tValues.push((cy + halfH - lineY1) / dy); // Bottom
    }

    let minT = Infinity;
    for (const t of tValues) {
      if (t > 0.001 && t <= 1.001) { // t should be between 0 (source) and 1 (target node center)
        const ix = lineX1 + t * dx;
        const iy = lineY1 + t * dy;
        // Check if intersection point is on the rectangle's boundary
        if (ix >= rectX - 0.1 && ix <= rectX + rectW + 0.1 && iy >= rectY - 0.1 && iy <= rectY + rectH + 0.1) {
          minT = Math.min(minT, t);
        }
      }
    }
    
    if (minT === Infinity) { // Fallback if no intersection found (e.g. source inside target)
      return {x: lineX2, y: lineY2};
    }
    return {x: lineX1 + minT * dx, y: lineY1 + minT * dy};
  };


  return (
    <div className="glassmorphism p-4 rounded-xl overflow-auto">
      {allNodes.length > maxNodes && (
        <p className="text-sm text-yellow-400 mb-2 text-center">
          Graph display simplified (showing top {maxNodes} most frequent activities).
        </p>
      )}
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="w-full h-auto"
        style={{ minWidth: `${Math.max(600, svgWidth)}px` }}
      >
        <defs>
          <marker
            id="arrowheadClear"
            viewBox="0 0 10 10"
            markerWidth="10"
            markerHeight="10"
            refX="8" 
            refY="5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,2 L8,5 L0,8 Z" fill="#FFD700" stroke="#F59E0B" strokeWidth="1" />
          </marker>
        </defs>
        
        {/* Edges */}
        {displayEdges.map((edge, i) => {
          const sourceNodePos = nodePositions.get(edge.source);
          const targetNodePos = nodePositions.get(edge.target);
          if (!sourceNodePos || !targetNodePos) return null;

          const { cx: sourceCenterX, cy: sourceCenterY } = sourceNodePos;
          const { x: targetRectX, y: targetRectY, cx: targetCenterX, cy: targetCenterY } = targetNodePos;

          const endPoint = getRectIntersectionPoint(
            targetRectX, targetRectY, nodeWidth, nodeHeight,
            sourceCenterX, sourceCenterY, targetCenterX, targetCenterY
          );
          
          const midX = (sourceCenterX + endPoint.x) / 2;
          const midY = (sourceCenterY + endPoint.y) / 2;

          return (
            <g key={`edge-${i}`}>
              <line
                x1={sourceCenterX}
                y1={sourceCenterY}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#0ea5e9" // sky-500
                strokeWidth="2"
                markerEnd="url(#arrowheadClear)"
              />
              <rect x={midX - 10} y={midY - 8} width="20" height="16" fill="#1e293b" rx="3" /> {/* slate-800 */}
              <text
                x={midX}
                y={midY + 4} 
                fill="#cbd5e1" // slate-300
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {edge.count}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {displayNodes.map((node) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <rect 
                width={nodeWidth} 
                height={nodeHeight} 
                rx="8" 
                fill="#0f172a" // bg-slate-900
                stroke="#38bdf8" // sky-400
                strokeWidth="2" 
              />
              <foreignObject x="5" y="5" width={nodeWidth - 10} height={nodeHeight - 10}>
                <div 
                    className="w-full h-full flex flex-col items-center justify-center text-center p-1 break-words">
                    <p className="text-xs font-semibold text-sky-200 leading-tight line-clamp-2">
                        {node.id}
                    </p>
                    <p 
                        className="text-slate-400 mt-1" 
                        style={{ fontSize: '0.65rem' }}
                    >
                        Freq: {node.count}
                    </p>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};


const ProcessAnalyzerPage: React.FC<ProcessAnalyzerPageProps> = ({ processData, addAlert }) => {
  const [analysis, setAnalysis] = useState<ProcessAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [processedMetrics, setProcessedMetrics] = useState<ProcessMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  useEffect(() => {
    if (processData && processData.length > 0) {
      setIsLoadingMetrics(true);
      setTimeout(() => {
        try {
          const metrics = calculateProcessMetrics(processData);
          setProcessedMetrics(metrics);
          addAlert('info', `Process data metrics calculated successfully.`);
        } catch (e: any) {
          addAlert('error', `Error calculating process metrics: ${e.message}`);
          setProcessedMetrics(null);
        }
        setIsLoadingMetrics(false);
      }, 50); 
    } else {
      setProcessedMetrics(null); 
    }
  }, [processData, addAlert]);

  const generateAnalysis = useCallback(async () => {
    if (!processData || processData.length === 0) {
      addAlert('warning', 'No process data available to analyze. Please upload data first.');
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const sampleForAI = processData.length > 200 ? processData.slice(0, 200) : processData;
      const resultText = await geminiService.generateProcessInsights(sampleForAI); 
      
      let parsedAnalysis: ProcessAnalysis;
      try {
        let jsonStr = resultText.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        parsedAnalysis = JSON.parse(jsonStr) as ProcessAnalysis;
        if (!parsedAnalysis.summary || !parsedAnalysis.bottlenecks || !parsedAnalysis.complianceIssues || !parsedAnalysis.improvementSuggestions) {
            throw new Error("Parsed JSON lacks required fields for ProcessAnalysis");
        }
      } catch (e) {
        console.warn("Gemini response was not valid JSON for ProcessAnalysis, using text as summary:", e);
        parsedAnalysis = {
            summary: resultText || "AI analysis could not be fully structured. Review raw output.",
            bottlenecks: ["Review AI summary for details"],
            complianceIssues: ["Review AI summary for details"],
            improvementSuggestions: ["Review AI summary for details"]
        };
      }
      
      setAnalysis(parsedAnalysis);
      addAlert('success', 'AI process analysis generated successfully.');
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      addAlert('error', `Failed to generate AI analysis: ${error.message}`);
      setAnalysis({
        summary: 'Error generating analysis. Please try again.',
        bottlenecks: [], complianceIssues: [], improvementSuggestions: []
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [processData, addAlert]);

  const exportJSON = () => {
    if (!processData) {
        addAlert('warning', 'No data to export.');
        return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(processData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "process_data.json";
    link.click();
    addAlert('success', 'Process data exported as JSON.');
  };

  const exportReportPrint = () => {
    addAlert('info', 'Generating print view for PDF report. Use browser print options (Ctrl+P or Cmd+P) to save as PDF.');
    window.print();
  };

  const sortedActivityFrequencies = useMemo(() => {
    if (!processedMetrics) return [];
    return Array.from(processedMetrics.activityFrequencies.entries())
      .sort(([, countA], [, countB]) => countB - countA);
  }, [processedMetrics]);

  const sortedVariants = useMemo(() => {
    if (!processedMetrics) return [];
    return Array.from(processedMetrics.variants.entries())
      .sort(([, countA], [, countB]) => countB - countA);
  }, [processedMetrics]);
  
  const totalVariantOccurrences = useMemo(() => {
    return sortedVariants.reduce((sum, [, count]) => sum + count, 0);
  }, [sortedVariants]);


  if (!processData || processData.length === 0) {
    return (
      <div className="text-center py-10 glassmorphism animate-fadeIn">
        <DocumentMagnifyingGlassIcon className="h-24 w-24 text-brand-teal mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-4">Process Analyzer</h2>
        <p className="text-gray-400 mb-6">Please upload process data first to enable analysis features.</p>
        <Link to={NavigationPath.Upload} className="bg-brand-teal hover:bg-brand-teal/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
          Go to Data Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-white">Process Analyzer</h2>
        <div className="flex flex-wrap space-x-0 sm:space-x-3 space-y-2 sm:space-y-0 w-full sm:w-auto">
            <button
                onClick={generateAnalysis}
                disabled={isLoadingAnalysis || isLoadingMetrics}
                className="w-full sm:w-auto bg-brand-gold hover:bg-yellow-400 text-slate-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center disabled:opacity-50"
            >
                {isLoadingAnalysis ? ( <><svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</> ) 
                : ( <><LightBulbIcon className="h-5 w-5 mr-2" />Generate AI Insights</> )}
            </button>
            <button onClick={exportJSON} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center" title="Export Process Data as JSON" >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> JSON
            </button>
             <button onClick={exportReportPrint} className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center" title="Generate PDF Report (Print)" >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> PDF Report
            </button>
        </div>
      </div>

      {isLoadingMetrics && (
         <div className="glassmorphism p-6 rounded-xl text-center">
            <svg className="animate-spin mx-auto h-12 w-12 text-brand-teal mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-lg text-gray-300">Calculating process metrics, please wait...</p>
        </div>
      )}
      
      {!isLoadingMetrics && processedMetrics && (
        <>
          <section className="glassmorphism p-6 rounded-xl">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center"><ChartBarIcon className="h-6 w-6 mr-2 text-brand-teal"/>Key Process Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <UsersIcon className="h-8 w-8 mx-auto mb-2 text-brand-gold"/>
                <p className="text-3xl font-bold text-white">{processedMetrics.totalCases}</p>
                <p className="text-sm text-gray-400">Total Cases</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <ArrowsRightLeftIcon className="h-8 w-8 mx-auto mb-2 text-brand-gold"/>
                <p className="text-3xl font-bold text-white">{processedMetrics.totalEvents}</p>
                <p className="text-sm text-gray-400">Total Events</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <ClockIcon className="h-8 w-8 mx-auto mb-2 text-brand-gold"/>
                <p className="text-3xl font-bold text-white">{formatDuration(processedMetrics.averageCaseDurationMs)}</p>
                <p className="text-sm text-gray-400">Avg. Case Duration</p>
              </div>
            </div>
          </section>

          {isLoadingAnalysis && !analysis && (
            <div className="glassmorphism p-6 rounded-xl text-center">
                <svg className="animate-spin mx-auto h-12 w-12 text-brand-teal mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-lg text-gray-300">Generating AI insights, please wait...</p>
            </div>
          )}
          {analysis && (
            <section className="glassmorphism p-6 rounded-xl">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center"><LightBulbIcon className="h-6 w-6 mr-2 text-brand-gold"/>AI Generated Summary</h3>
              <div className="prose prose-sm sm:prose-base prose-invert max-w-none text-gray-300 space-y-3">
                <p>{analysis.summary}</p>
                {analysis.bottlenecks?.length > 0 && (<div><h4 className="font-semibold text-brand-gold">Key Bottlenecks:</h4><ul className="list-disc list-inside">{analysis.bottlenecks.map((item, idx) => <li key={`b-${idx}`}>{item}</li>)}</ul></div>)}
                {analysis.complianceIssues?.length > 0 && (<div><h4 className="font-semibold text-brand-gold">Compliance Gaps:</h4><ul className="list-disc list-inside">{analysis.complianceIssues.map((item, idx) => <li key={`c-${idx}`}>{item}</li>)}</ul></div>)}
                {analysis.improvementSuggestions?.length > 0 && (<div><h4 className="font-semibold text-brand-gold">Improvement Opportunities:</h4><ul className="list-disc list-inside">{analysis.improvementSuggestions.map((item, idx) => <li key={`i-${idx}`}>{item}</li>)}</ul></div>)}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center"><LinkChainIcon className="h-6 w-6 mr-2 text-brand-teal"/>Process Flow (Directly-Follows Graph)</h3>
            <ProcessGraphSVG metrics={processedMetrics} />
          </section>

          <section className="glassmorphism p-6 rounded-xl">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center"><ChartBarIcon className="h-6 w-6 mr-2 text-brand-teal"/>Activity Analysis</h3>
            <div className="max-h-96 overflow-y-auto">
              {sortedActivityFrequencies.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th scope="col" className="px-6 py-3">Activity Name</th>
                      <th scope="col" className="px-6 py-3">Frequency</th>
                      <th scope="col" className="px-6 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActivityFrequencies.map(([activity, count], idx) => {
                       const percentage = processedMetrics.totalEvents > 0 ? (count / processedMetrics.totalEvents) * 100 : 0;
                       return (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{activity}</td>
                          <td className="px-6 py-4">{count}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-full bg-slate-600 rounded-full h-2.5 mr-2">
                                <div className="bg-brand-teal h-2.5 rounded-full" style={{ width: `${percentage.toFixed(0)}%` }}></div>
                              </div>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              ) : <p className="text-gray-400">No activity data available.</p>}
            </div>
          </section>
          
          <section className="glassmorphism p-6 rounded-xl">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center"><DocumentMagnifyingGlassIcon className="h-6 w-6 mr-2 text-brand-teal"/>Variant Analysis (Top 10)</h3>
            <div className="max-h-96 overflow-y-auto">
             {sortedVariants.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th scope="col" className="px-6 py-3">Variant (Sequence of Activities)</th>
                      <th scope="col" className="px-6 py-3">Frequency</th>
                      <th scope="col" className="px-6 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVariants.slice(0, 10).map(([variant, count], idx) => {
                       const percentage = totalVariantOccurrences > 0 ? (count / totalVariantOccurrences) * 100 : 0;
                       return (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-6 py-4 font-medium text-white whitespace-nowrap overflow-x-auto max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">{variant}</td>
                          <td className="px-6 py-4">{count}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center">
                              <div className="w-full bg-slate-600 rounded-full h-2.5 mr-2">
                                <div className="bg-brand-gold h-2.5 rounded-full" style={{ width: `${percentage.toFixed(0)}%` }}></div>
                              </div>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              ) : <p className="text-gray-400">No variant data available.</p>}
            </div>
             {sortedVariants.length > 10 && <p className="text-xs text-gray-400 mt-2 text-center">Showing top 10 out of {sortedVariants.length} variants.</p>}
          </section>
        </>
      )}
    </div>
  );
};

export default ProcessAnalyzerPage;
