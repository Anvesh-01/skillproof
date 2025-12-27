"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { TrendingUp, Award, Activity, Upload, Brain, Calendar, User, Mail } from "lucide-react";

interface Exam {
  _id: string;
  certificateName: string;
  score: number;
  result: string;
  examDate: string;
}

interface ActivityLog {
  description: string;
  timestamp: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch exams
      const examsRes = await fetch(`/api/exams/user/${user?.id}`);
      const examsData = await examsRes.json();
      if (examsData.success) {
        setExams(examsData.data || []);
      }

      // Fetch activity logs
      const logsRes = await fetch(`/api/logs/user/${user?.id}`);
      const logsData = await logsRes.json();
      if (logsData.success) {
        setActivityLogs(logsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const completedExams = exams.filter(e => e.result).length;
  const avgScore = exams.length > 0
    ? (exams.reduce((sum, e) => sum + (e.score || 0), 0) / exams.length).toFixed(1)
    : "0";
  const passedExams = exams.filter(e => e.result === 'pass').length;

  // Prepare chart data
  const scoreData = exams.slice(0, 8).reverse().map(e => e.score || 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || "User"}! 👋
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">@{user?.username}</span>
            </span>
            <span className="hidden sm:inline text-gray-400">•</span>
            <span className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4" />
              {user?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-blue-600">{avgScore}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tests Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedExams}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Passed Exams</p>
                <p className="text-3xl font-bold text-purple-600">{passedExams}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push("/upload-certificate")}
            className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <Upload className="w-8 h-8" />
              <span className="text-blue-200 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Upload Certificate</h3>
            <p className="text-blue-100 text-sm">Add your achievements and credentials</p>
          </button>

          <button
            onClick={() => router.push("/select-certificate")}
            className="group bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8" />
              <span className="text-green-200 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Test Your Skills</h3>
            <p className="text-green-100 text-sm">Take a new assessment and track progress</p>
          </button>
        </div>

        {/* Skill Progress Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Skill Progress</h2>
          </div>
          <div className="h-64">
            {scoreData.length > 0 ? (
              <div className="h-full flex items-end justify-around gap-2 px-4">
                {scoreData.map((score, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 max-w-16">
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '200px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500 group"
                        style={{ height: `${score}%` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {score}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">T{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No test data available yet. Take your first test!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No activity logs yet</p>
              <p className="text-sm text-gray-400 mt-1">Your activities will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.slice(0, 10).map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{log.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}