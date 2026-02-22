"use client";

import { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { PlotPointNode } from "./PlotPointNode";

const nodeTypes = {
  plotPoint: PlotPointNode,
};

function PlotFlowCanvas({
  plotThreads = [],
  plotPoints = [],
  connections = [],
  selectedThread = null,
  onUpdate,
}) {
  // Filter points by selected thread
  const filteredPoints = useMemo(() => {
    if (!selectedThread) return plotPoints;
    return plotPoints.filter((p) => p.plot_thread_id === selectedThread);
  }, [plotPoints, selectedThread]);

  // Convert plot points to React Flow nodes
  const initialNodes = useMemo(() => {
    return filteredPoints.map((point) => {
      const thread = plotThreads.find((t) => t.id === point.plot_thread_id);
      return {
        id: point.id,
        type: "plotPoint",
        position: {
          x: point.position_x || 0,
          y: point.position_y || 0,
        },
        data: {
          ...point,
          threadColor: thread?.color || "#5a5fd8",
          threadTitle: thread?.title || "Unknown",
        },
      };
    });
  }, [filteredPoints, plotThreads]);

  // Convert connections to React Flow edges
  const initialEdges = useMemo(() => {
    // Start with existing connections from database
    const existingEdges = connections
      .filter((conn) => {
        const fromExists = filteredPoints.some((p) => p.id === conn.from_point_id);
        const toExists = filteredPoints.some((p) => p.id === conn.to_point_id);
        return fromExists && toExists;
      })
      .map((conn) => ({
        id: conn.id,
        source: conn.from_point_id,
        target: conn.to_point_id,
        type: "default",
        animated: conn.connection_type === "CAUSES",
        label: conn.connection_type,
        style: {
          stroke: conn.connection_type === "CAUSES" ? "#3b3b3b" : "#1a1a1a",
          strokeWidth: 2.5,
        },
      }));

    // Auto-connect nodes sequentially based on timeline_position (like n8n)
    const sortedPoints = [...filteredPoints].sort(
      (a, b) => (a.timeline_position || 0) - (b.timeline_position || 0)
    );

    const autoEdges = [];
    const existingConnections = new Set(
      existingEdges.map((e) => `${e.source}-${e.target}`)
    );

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const fromPoint = sortedPoints[i];
      const toPoint = sortedPoints[i + 1];
      const connectionKey = `${fromPoint.id}-${toPoint.id}`;

      // Only create auto-connection if it doesn't already exist
      if (!existingConnections.has(connectionKey)) {
        autoEdges.push({
          id: `auto-${fromPoint.id}-${toPoint.id}`,
          source: fromPoint.id,
          target: toPoint.id,
          type: "default",
          animated: false,
          style: {
            stroke: "#1a1a1a",
            strokeWidth: 2.5,
          },
        });
      }
    }

    return [...existingEdges, ...autoEdges];
  }, [connections, filteredPoints]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      // TODO: Create connection via API
    },
    [setEdges],
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      // Update node position via API
      if (onUpdate && node.position) {
        // TODO: Call updatePlotPoint API
        // updatePlotPoint({ pointId: node.id, positionX: node.position.x, positionY: node.position.y });
      }
    },
    [onUpdate],
  );

  return (
    <div className="flex-1 w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#fafafa]"
      >
        <Background variant="dots" gap={20} size={1} color="#000000" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data?.threadColor || "#ced3ff";
          }}
          maskColor="rgba(255, 255, 255, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

export { PlotFlowCanvas };
