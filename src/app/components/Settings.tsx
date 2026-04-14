import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { User, Bell, Shield, LogOut, AlertTriangle, Save, Trash2, Sun, Monitor, Moon, Volume2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'account'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock settings state
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailAlerts: false,
    soundEnabled: true,
    theme: 'system',
    language: 'ko',
  });

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateProfile(name);
      setIsSaving(false);
      alert('프로필이 성공적으로 저장되었습니다.');
    }, 600);
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <h1 className="text-2xl font-black text-slate-800">설정</h1>
        <p className="text-slate-500 mt-1 font-medium">계정 정보 및 앱 환경을 설정하세요.</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col space-y-1">
              <TabButton 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')}
                icon={<User />}
                label="마이페이지" 
              />
              <TabButton 
                active={activeTab === 'notifications'} 
                onClick={() => setActiveTab('notifications')}
                icon={<Bell />}
                label="알림 및 환경" 
              />
              <TabButton 
                active={activeTab === 'account'} 
                onClick={() => setActiveTab('account')}
                icon={<Shield />}
                label="보안 및 계정" 
              />
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">마이페이지</h2>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-indigo-50">
                      <span className="text-4xl">🐢</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">나의 반려 거북이</h3>
                      <p className="text-slate-500 font-medium">Lv.{user?.level} • 건강함</p>
                      <button className="mt-2 text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                        캐릭터 변경하기
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                      <input 
                        type="email" 
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">이메일은 변경할 수 없습니다.</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? '저장 중...' : '변경사항 저장'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">알림 및 환경</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">스트레칭 푸시 알림</p>
                          <p className="text-sm text-slate-500">거북목이 감지되면 시스템 푸시 알림을 보냅니다.</p>
                        </div>
                      </div>
                      <Toggle checked={settings.pushEnabled} onChange={() => toggleSetting('pushEnabled')} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">경고음</p>
                          <p className="text-sm text-slate-500">화면이 잠길 때 소리로 알려줍니다.</p>
                        </div>
                      </div>
                      <Toggle checked={settings.soundEnabled} onChange={() => toggleSetting('soundEnabled')} />
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h3 className="font-bold text-slate-800 mb-4">테마 및 언어</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <ThemeCard icon={<Monitor />} label="시스템 설정" active={settings.theme === 'system'} onClick={() => setSettings(s => ({...s, theme: 'system'}))} />
                        <ThemeCard icon={<Sun />} label="라이트 모드" active={settings.theme === 'light'} onClick={() => setSettings(s => ({...s, theme: 'light'}))} />
                        <ThemeCard icon={<Moon />} label="다크 모드" active={settings.theme === 'dark'} onClick={() => setSettings(s => ({...s, theme: 'dark'}))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeTab === 'account' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">보안 및 계정</h2>
                  
                  <div className="space-y-6">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors text-left">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">비밀번호 변경</p>
                          <p className="text-sm text-slate-500">주기적으로 비밀번호를 변경하여 보안을 유지하세요.</p>
                        </div>
                      </div>
                      <span className="text-indigo-600 font-bold text-sm">변경</span>
                    </button>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-500">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">로그아웃</p>
                          <p className="text-sm text-slate-500">현재 기기에서 로그아웃합니다.</p>
                        </div>
                      </div>
                    </button>
                    
                    <div className="pt-8 mt-8 border-t border-red-100">
                      <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Danger Zone
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">계정을 삭제하면 모든 주간 리포트 데이터와 반려 거북이 성장 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
                      
                      {!showDeleteConfirm ? (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
                        >
                          계정 탈퇴
                        </button>
                      ) : (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-red-800">정말로 탈퇴하시겠습니까?</p>
                            <p className="text-sm text-red-600">모든 데이터가 삭제됩니다.</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-3 py-1.5 bg-white text-slate-600 rounded-md text-sm font-bold border border-slate-200 hover:bg-slate-50"
                            >
                              취소
                            </button>
                            <button 
                              onClick={handleDeleteAccount}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> 탈퇴하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// UI Components
const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {/* 수정된 부분: 제네릭으로 className 타입을 명시 */}
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
    {label}
  </button>
);

const Toggle: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      checked ? 'bg-indigo-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const ThemeCard: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
      active 
        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
    }`}
  >
    {/* 수정된 부분: 제네릭으로 className 타입을 명시 */}
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 mb-2' })}
    <span className="text-sm font-bold">{label}</span>
  </button>
);