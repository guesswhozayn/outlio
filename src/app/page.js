"use client";

import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import JobInput from "@/components/JobInput";
import SettingsDrawer from "@/components/SettingsDrawer";
import ExtractedFieldsTab from "@/components/ExtractedFieldsTab";
import HistoryTab from "@/components/HistoryTab";
import EmailPreviewTab from "@/components/EmailPreviewTab";

import { useAutoMailer } from "@/hooks/useAutoMailer";
export default function Home() {
  const { theme, setTheme } = useTheme();
  const am = useAutoMailer();

  if (am.status === "loading") {
    return (
      <div className="app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (am.status === "unauthenticated") {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="logo-icon" style={{ display: 'inline-block', marginBottom: '1rem', width: '40px', height: '40px', lineHeight: '40px' }}>AM</div>
          <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>AutoMailer</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Sign in with Google to securely sync your configuration across devices.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        mounted={am.mounted}
        theme={theme}
        setTheme={setTheme}
        setSettingsOpen={am.setSettingsOpen}
      />

      <div className="dashboard-grid">
        <JobInput
          postText={am.postText}
          setPostText={am.setPostText}
          logs={am.logs}
          handleImageUploadClick={am.handleImageUploadClick}
          imageInputRef={am.imageInputRef}
          handleImageChange={am.handleImageChange}
          screenshotName={am.screenshotName}
          setScreenshotData={am.setScreenshotData}
          setScreenshotName={am.setScreenshotName}
          isParsing={am.isParsing}
          screenshotData={am.screenshotData}
          handleParsePost={am.handleParsePost}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ height: "100%", justifyContent: "flex-start" }}>
            <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <div className="tabs">
                <button
                  className={`tab ${am.activeTab === "preview" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("preview")}
                >
                  Email Preview
                </button>
                <button
                  className={`tab ${am.activeTab === "details" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("details")}
                >
                  Extracted Fields
                </button>
                <button
                  className={`tab ${am.activeTab === "history" ? "active" : ""}`}
                  onClick={() => am.setActiveTab("history")}
                >
                  History
                </button>
              </div>
            </div>

            {am.activeTab === "details" && (
              <ExtractedFieldsTab fields={am.fields} setFields={am.setFields} />
            )}

            {am.activeTab === "history" && (
              <HistoryTab
                history={am.history}
                setFields={am.setFields}
                setIsColdEmail={am.setIsColdEmail}
                setIsFollowUp={am.setIsFollowUp}
                setActiveTab={am.setActiveTab}
                setIsManuallyEdited={am.setIsManuallyEdited}
              />
            )}

            {am.activeTab === "preview" && (
              <EmailPreviewTab
                isFollowUp={am.isFollowUp}
                setIsFollowUp={am.setIsFollowUp}
                isColdEmail={am.isColdEmail}
                setIsColdEmail={am.setIsColdEmail}
                coldEmailRole={am.coldEmailRole}
                setColdEmailRole={am.setColdEmailRole}
                fields={am.fields}
                setFields={am.setFields}
                subject={am.subject}
                setSubject={am.setSubject}
                emailBody={am.emailBody}
                setEmailBody={am.setEmailBody}
                setIsManuallyEdited={am.setIsManuallyEdited}
                resumeExists={am.resumeExists}
                resumeFile={am.resumeFile}
                settings={am.settings}
                handleTailorResume={am.handleTailorResume}
                isTailoring={am.isTailoring}
                handleUploadClick={am.handleUploadClick}
                isUploading={am.isUploading}
                fileInputRef={am.fileInputRef}
                handleFileChange={am.handleFileChange}
                isSending={am.isSending}
                hasGmailConfig={am.hasGmailConfig}
                handleSendEmail={am.handleSendEmail}
              />
            )}
          </div>
        </div>
      </div>

      <SettingsDrawer
        settingsOpen={am.settingsOpen}
        setSettingsOpen={am.setSettingsOpen}
        settings={am.settings}
        setSettings={am.setSettings}
        hasGeminiKey={am.hasGeminiKey}
        isFetchingModels={am.isFetchingModels}
        availableModels={am.availableModels}
        hasGmailConfig={am.hasGmailConfig}
        isSavingSettings={am.isSavingSettings}
        handleSaveSettings={am.handleSaveSettings}
      />
    </div>
  );
}
