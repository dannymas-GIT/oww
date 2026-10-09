import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/oww/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DEFAULT_STATE } from '@/lib/constants';
import {
  HIRING_ROLES,
  ORG_ADMIN_ROLES,
  PLATFORM_ADMIN_ROLES,
  PLATFORM_EDITOR_ROLES,
  PLATFORM_OPS_ROLES,
  PLATFORM_PEOPLE_ROLES,
  PLATFORM_USERS_ROLES,
} from '@/config/nav';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterUtilityPage from '@/pages/auth/RegisterUtilityPage';
import ProfilePage from '@/pages/auth/ProfilePage';

import HomePage from '@/pages/public/HomePage';
import CareerPathwayPage from '@/pages/public/CareerPathwayPage';
import HirePathwayPage from '@/pages/public/HirePathwayPage';
import EducatePathwayPage from '@/pages/public/EducatePathwayPage';
import AmbassadorPathwayPage from '@/pages/public/AmbassadorPathwayPage';
import InterestFormPage from '@/pages/public/InterestFormPage';
import ProgramSubmitPage from '@/pages/public/ProgramSubmitPage';
import JobsBoardPage from '@/pages/public/JobsBoardPage';
import JobDetailPage from '@/pages/public/JobDetailPage';
import BlogListPage from '@/pages/public/BlogListPage';
import BlogPostPage from '@/pages/public/BlogPostPage';
import CompaniesPage from '@/pages/public/CompaniesPage';
import CompanyDetailPage from '@/pages/public/CompanyDetailPage';
import RegionalCategoryPage from '@/pages/public/RegionalCategoryPage';

import CandidateDashboard from '@/pages/candidate/CandidateDashboard';
import IndividualProfilePage from '@/pages/candidate/IndividualProfilePage';
import MatchesPage from '@/pages/candidate/MatchesPage';

import EmployerDashboard from '@/pages/employer/EmployerDashboard';
import OrgProfilePage from '@/pages/employer/OrgProfilePage';
import JobsManagePage from '@/pages/employer/JobsManagePage';
import CandidateSearchPage from '@/pages/employer/CandidateSearchPage';
import ApplicationsPage from '@/pages/employer/ApplicationsPage';
import MessagingPage from '@/pages/employer/MessagingPage';
import InterviewSchedulePage from '@/pages/employer/InterviewSchedulePage';

import EducatorDashboard from '@/pages/educator/EducatorDashboard';
import AmbassadorDashboard from '@/pages/ambassador/AmbassadorDashboard';

import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminJurisdictionsPage from '@/pages/admin/AdminJurisdictionsPage';
import AdminCmsPage from '@/pages/admin/AdminCmsPage';
import AdminCmsEditorPage from '@/pages/admin/AdminCmsEditorPage';
import AdminProgramsPage from '@/pages/admin/AdminProgramsPage';
import AdminFeaturedPostsPage from '@/pages/admin/AdminFeaturedPostsPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminCertificationsPage from '@/pages/admin/AdminCertificationsPage';
import AdminLocationsPage from '@/pages/admin/AdminLocationsPage';
import NationalMapPage from '@/pages/admin/NationalMapPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminLoginsPage from '@/pages/admin/AdminLoginsPage';
import AdminMembershipsPage from '@/pages/admin/AdminMembershipsPage';
import AdminCommunicationsPage from '@/pages/admin/AdminCommunicationsPage';
import AdminRegistrationsPage from '@/pages/admin/AdminRegistrationsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminPeopleDirectoryPage from '@/pages/admin/people/AdminPeopleDirectoryPage';

import PricingPage from '@/pages/billing/PricingPage';
import BillingPage from '@/pages/billing/BillingPage';
import SampleCheckoutPage from '@/pages/billing/SampleCheckoutPage';
import BillingSuccessPage from '@/pages/billing/BillingSuccessPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to={`/${DEFAULT_STATE}`} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/utility" element={<RegisterUtilityPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/sample-checkout"
          element={
            <ProtectedRoute>
              <SampleCheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/success"
          element={
            <ProtectedRoute>
              <BillingSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route path="/:state" element={<HomePage />} />
        <Route path="/:state/career" element={<CareerPathwayPage />} />
        <Route path="/:state/hire" element={<HirePathwayPage />} />
        <Route path="/:state/educate" element={<EducatePathwayPage />} />
        <Route path="/:state/ambassador" element={<AmbassadorPathwayPage />} />
        <Route path="/:state/interest" element={<InterestFormPage />} />
        <Route path="/:state/programs/submit" element={<ProgramSubmitPage />} />
        <Route path="/:state/jobs" element={<JobsBoardPage />} />
        <Route path="/:state/jobs/:id" element={<JobDetailPage />} />
        <Route path="/:state/blog" element={<BlogListPage />} />
        <Route path="/:state/blog/:slug" element={<BlogPostPage />} />
        <Route path="/:state/companies" element={<CompaniesPage />} />
        <Route path="/:state/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/:state/regional/:category" element={<RegionalCategoryPage />} />

        <Route
          path="/candidate"
          element={
            <ProtectedRoute roles={['individual', 'student']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute roles={['individual', 'student']}>
              <IndividualProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/matches"
          element={
            <ProtectedRoute roles={['individual', 'student']}>
              <MatchesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/org"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <OrgProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <JobsManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/candidates"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <CandidateSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/applications"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/messages"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <MessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/interviews"
          element={
            <ProtectedRoute roles={HIRING_ROLES}>
              <InterviewSchedulePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/team"
          element={
            <ProtectedRoute roles={ORG_ADMIN_ROLES}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator"
          element={
            <ProtectedRoute roles={['educator']}>
              <EducatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ambassador"
          element={
            <ProtectedRoute roles={['ambassador']}>
              <AmbassadorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logins"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminLoginsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/memberships"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminMembershipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/communications"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminCommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={PLATFORM_USERS_ROLES}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/registrations"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminRegistrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/people/candidates"
          element={
            <ProtectedRoute roles={PLATFORM_PEOPLE_ROLES}>
              <AdminPeopleDirectoryPage audience="candidates" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/people/hirers"
          element={
            <ProtectedRoute roles={PLATFORM_PEOPLE_ROLES}>
              <AdminPeopleDirectoryPage audience="hirers" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/people/ambassadors"
          element={
            <ProtectedRoute roles={PLATFORM_PEOPLE_ROLES}>
              <AdminPeopleDirectoryPage audience="ambassadors" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/people/educators"
          element={
            <ProtectedRoute roles={PLATFORM_PEOPLE_ROLES}>
              <AdminPeopleDirectoryPage audience="educators" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={PLATFORM_ADMIN_ROLES}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jurisdictions"
          element={
            <ProtectedRoute roles={PLATFORM_ADMIN_ROLES}>
              <AdminJurisdictionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminCmsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/:id"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminCmsEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/programs"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/featured"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminFeaturedPostsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={PLATFORM_OPS_ROLES}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/certifications"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminCertificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute roles={PLATFORM_EDITOR_ROLES}>
              <AdminLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/map"
          element={
            <ProtectedRoute roles={PLATFORM_ADMIN_ROLES}>
              <NationalMapPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={`/${DEFAULT_STATE}`} replace />} />
      </Route>
    </Routes>
  );
}
