import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Image, Folder, ShoppingBasket, Grid3x3, User, Home, Layout } from 'lucide-react';
import NewManageBanner from '@/features/content-management/banner/manage/NewManageBanner';
import ManageBucket from '@/features/content-management/bucket/manage/ManageBucket';
import ManageBasket from '@/features/content-management/basket/manage/ManageBasket';
import ManageHomeScreen from '@/features/content-management/homescreen/manage/ManageHomeScreen';
import HomeScreenManagement from '@/features/content-management/homescreen/manage/HomeScreenManagement';
import CreateNewBanner from '@/features/content-management/banner/create/createNewBanner';
import CreateBucket from '@/features/content-management/bucket/create/CreateBucket';
import CreateBasket from '@/features/content-management/basket/create/CreateBasket';
import CreateBlock from '@/features/content-management/block/create/CreateBlock';
import salescodeLogo from '../../assets/salescode.png';
import { RoleSelectionModal } from './RoleSelectionModal';
import { store } from '@/utils/UtilityService';

type OptionType = 'banner' | 'bucket' | 'basket' | 'block' | 'homeScreenManagement';
type ViewType = 'manage' | 'create';

interface ManagementOption {
  id: OptionType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  manageComponent: React.FC<any>;
  createComponent: React.FC<any>;
}

const OPTIONS: ManagementOption[] = [
  {
    id: 'banner',
    title: 'Banner',
    subtitle: 'Manage Banners',
    icon: <Image size={20} />,
    manageComponent: NewManageBanner,
    createComponent: CreateNewBanner,
  },
  {
    id: 'bucket',
    title: 'Bucket',
    subtitle: 'Manage Buckets',
    icon: <Folder size={20} />,
    manageComponent: ManageBucket,
    createComponent: CreateBucket,
  },
  {
    id: 'basket',
    title: 'Basket',
    subtitle: 'Manage Baskets',
    icon: <ShoppingBasket size={20} />,
    manageComponent: ManageBasket,
    createComponent: CreateBasket,
  },
  {
    id: 'block',
    title: 'Block',
    subtitle: 'Manage Blocks',
    icon: <Grid3x3 size={20} />,
    manageComponent: ManageHomeScreen,
    createComponent: CreateBlock,
  },
  {
    id: 'homeScreenManagement',
    title: 'HomeScreen Management',
    subtitle: 'Manage Home Screen',
    icon: <Layout size={20} />,
    manageComponent: HomeScreenManagement,
    createComponent: HomeScreenManagement,
  },
];

const MANAGE_PATHS = ['/banner', '/bucket', '/basket', '/block', '/homeScreenManagement'];

export const UnifiedManagementPage: React.FC = () => {
  const realNavigate = useNavigate();
  const location = useLocation();
  const navigationContext = React.useContext(UNSAFE_NavigationContext);
  const savedRole: any = useSelector(() => store.getState().roleState.role);
  const [currentOption, setCurrentOption] = useState<OptionType>('banner');
  const [view, setView] = useState<ViewType>('manage');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; label: string } | null>(null);
  const [createData, setCreateData] = useState<any>(null);

  useEffect(() => {
    if (savedRole && savedRole.id && savedRole.label) {
      setSelectedRole(savedRole);
      setShowRoleModal(false);
    } else {
      setShowRoleModal(true);
    }
  }, [savedRole]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/banner')) {
      setCurrentOption('banner');
    } else if (path.includes('/bucket')) {
      setCurrentOption('bucket');
    } else if (path.includes('/basket')) {
      setCurrentOption('basket');
    } else if (path.includes('/block')) {
      setCurrentOption('block');
    } else if (path.includes('/homeScreenManagement')) {
      setCurrentOption('homeScreenManagement');
    }
  }, []);

  // When URL is a manage path (e.g. /banner), always show manage view so back from /create-banner shows list
  useEffect(() => {
    if (MANAGE_PATHS.includes(location.pathname)) {
      setView('manage');
    }
  }, [location.pathname]);

  const activeOption = OPTIONS.find(o => o.id === currentOption) || OPTIONS[0];
  // Derive from URL so /banner always shows manage view (fixes wrong content after success from /create-banner)
  const isManagePath = MANAGE_PATHS.includes(location.pathname);
  const effectiveView = isManagePath ? 'manage' : view;
  const ActiveComponent = effectiveView === 'manage' ? activeOption.manageComponent : activeOption.createComponent;

  const handleOptionChange = (optionId: OptionType) => {
    setCurrentOption(optionId);
    setView('manage');
    setCreateData(null);
    realNavigate(`/${optionId}`, { replace: true });
  };

  const navigateToCreate = (data?: any) => {
    setView('create');
    setCreateData(data);
  };

  const navigateToManage = () => {
    setView('manage');
    setCreateData(null);
  };

  useEffect(() => {
    if (view === 'create') {
      const originalBack = window.history.back.bind(window.history);
      window.history.back = () => {
        navigateToManage();
      };
      return () => {
        window.history.back = originalBack;
      };
    }
  }, [view]);

  const customNavigationContext = React.useMemo(() => {
    if (!navigationContext) return navigationContext;

    return {
      ...navigationContext,
      navigator: {
        ...navigationContext.navigator,
        go: (delta: number) => {
          if (delta === -1 && view === 'create') {
            navigateToManage();
          } else {
            navigationContext.navigator.go(delta);
          }
        },
        createHref: navigationContext.navigator.createHref,
        encodeLocation: navigationContext.navigator.encodeLocation,
        push: (to: any, state?: any) => {
          const path = typeof to === 'string' ? to : to.pathname;
          if (path === '/banner' || path === '/bucket' || path === '/basket' || path === '/block' || path === '/homeScreenManagement') {
            navigateToCreate(state);
          } else {
            navigationContext.navigator.push(to, state);
          }
        },
        replace: (to: any, state?: any) => {
          const path = typeof to === 'string' ? to : to.pathname;
          if (path === '/banner' || path === '/bucket' || path === '/basket' || path === '/block' || path === '/homeScreenManagement') {
            navigateToCreate(state);
          } else {
            navigationContext.navigator.replace(to, state);
          }
        },
      },
    };
  }, [navigationContext, view, navigateToCreate, navigateToManage]);

  const handleRoleSelected = (role: { id: string; label: string }) => {
    setSelectedRole(role);
    setShowRoleModal(false);
  };

  // Don't render content until role is selected
  if (!selectedRole) {
    return <RoleSelectionModal open={showRoleModal} onRoleSelected={handleRoleSelected} />;
  }

  return (
    <UNSAFE_NavigationContext.Provider value={customNavigationContext}>
      <RoleSelectionModal open={showRoleModal} onRoleSelected={handleRoleSelected} />
      <div className="flex h-screen w-full overflow-hidden">
        <div className="flex w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
          <aside className={`h-screen border-r border-slate-200 bg-white transition-all duration-300 flex flex-col relative z-50 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
          <div className="p-5 flex items-center justify-between">
            {!isSidebarCollapsed && <span className="font-bold text-slate-800">Content Management</span>}
            <div className="flex gap-1">
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          </div>

          <div className="px-5 mb-6">
            {isSidebarCollapsed ? (
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center overflow-hidden">
                <img src={salescodeLogo} alt="Salescode" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Profile</label>
                <button 
                  onClick={() => setShowRoleModal(true)}
                  className="w-full p-2 text-xs font-bold border border-slate-200 bg-transparent rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <span className="truncate flex-1">{selectedRole?.label || 'Select Role'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2 scrollbar-hide">
            {OPTIONS.map((option) => {
              const isActive = currentOption === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => handleOptionChange(option.id)}
                  className={`relative flex items-center cursor-pointer mb-4 p-3 rounded-lg transition-all duration-200 group ${
                    isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                    isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <div className={isActive ? 'text-white' : 'text-slate-600'}>
                      {option.icon}
                    </div>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="ml-3 overflow-hidden flex-1">
                      <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                        {option.title}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {option.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Back to Dashboard Button */}
          <div className="px-5 pb-5 mt-auto border-t border-slate-200 pt-4">
            <button
              onClick={() => realNavigate('/dashboard')}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-all">
                <Home size={16} className="text-slate-600" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                  Back to Dashboard
                </span>
              )}
            </button>
          </div>
        </aside>

          {/* Main Content */}
          <main className="flex-1 h-full overflow-auto">
            <ActiveComponent hideBackButton={true} />
          </main>
        </div>
      </div>
    </UNSAFE_NavigationContext.Provider>
  );
};

