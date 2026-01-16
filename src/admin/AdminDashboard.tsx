import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
  ICON_SIZES,
  COMPONENT_SIZES,
  ASSETS,
} from '../config/design'

interface NavItem {
  icon: string
  iconFilled?: string
  label: string
  active?: boolean
}

interface ContentCard {
  image: string
  title: string
  description: string
  onClick?: () => void
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'create' | 'search' | 'upload'>('create')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const navigate = useNavigate()

  const navItems: NavItem[] = [
    { icon: 'mdi:home-outline', iconFilled: 'mdi:home', label: 'Home', active: true },
    { icon: 'mdi:folder-outline', iconFilled: 'mdi:folder', label: 'My library' },
    { icon: 'mdi:calendar-blank-outline', iconFilled: 'mdi:calendar-blank', label: 'Sessions' },
    { icon: 'mdi:file-document-outline', iconFilled: 'mdi:file-document', label: 'Common\nAssessments' },
    { icon: 'mdi:account-group-outline', iconFilled: 'mdi:account-group', label: 'Students' },
    { icon: 'mdi:cog-outline', iconFilled: 'mdi:cog', label: 'Admin controls' },
  ]

  const contentCards: ContentCard[] = [
    {
      image: ASSETS.assessment,
      title: 'Assessment',
      description: 'Quick & interactive questions',
    },
    {
      image: ASSETS.presentation,
      title: 'Presentation',
      description: 'Slides with questions and whiteboard',
    },
    {
      image: ASSETS.video,
      title: 'Video',
      description: 'Questions at key points in the video',
    },
    {
      image: ASSETS.passage,
      title: 'Passage',
      description: 'Questions based on a passage',
    },
    {
      image: ASSETS.flashcard,
      title: 'Flashcards',
      description: 'Questions on front, answers on back',
    },
    {
      image: ASSETS.battleModeLogo,
      title: 'Battle Mode',
      description: 'Team vs team quiz battles',
      onClick: () => navigate('/admin/battle-field'),
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZES.sm,
        color: COLORS.baseText,
        backgroundColor: COLORS.white,
        colorScheme: 'light',
      }}
    >
      {/* Left Sidebar */}
      <aside
        style={{
          width: COMPONENT_SIZES.sidebar.width,
          minWidth: COMPONENT_SIZES.sidebar.width,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.sidebarBg,
          borderRight: `1px solid ${COLORS.borderGray}`,
        }}
      >
        {/* Logo Section */}
        <div style={{ padding: `${SPACING[5]} ${SPACING[4]} ${SPACING[3]}`, cursor: 'pointer' }}>
          <div
            style={{
              overflow: 'hidden',
              marginBottom: SPACING[6],
              width: 'auto',
              height: COMPONENT_SIZES.logo.height,
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <img
              src={ASSETS.logo}
              alt="Quizizz"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: `${SPACING[4]} ${SPACING[3]} ${SPACING[3]}` }}>
          {navItems.map((item, index) => (
            <button
              key={index}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[3],
                padding: `${SPACING[3]} ${SPACING[3]}`,
                borderRadius: BORDER_RADIUS.md,
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: FONT_SIZES.sm,
                fontWeight: item.active ? FONT_WEIGHTS.medium : FONT_WEIGHTS.regular,
                color: item.active ? COLORS.highlightedText : COLORS.baseText,
                backgroundColor: item.active ? COLORS.normalBg : 'transparent',
                marginBottom: SPACING[0],
                whiteSpace: 'pre-line',
                lineHeight: 1.3,
                fontFamily: FONT_FAMILY,
              }}
            >
              <Icon
                icon={item.active ? item.iconFilled! : item.icon}
                style={{
                  width: ICON_SIZES.lg,
                  height: ICON_SIZES.lg,
                  color: item.active ? COLORS.highlightedText : COLORS.baseText,
                  flexShrink: 0,
                }}
              />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Separator */}
          <div style={{ height: '1px', backgroundColor: COLORS.borderGray, margin: `${SPACING[3]} ${SPACING[3]}` }} />

          {/* VoyageMath External Link */}
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: SPACING[3],
              padding: `${SPACING[3]} ${SPACING[3]}`,
              borderRadius: BORDER_RADIUS.md,
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: FONT_SIZES.sm,
              fontWeight: FONT_WEIGHTS.regular,
              color: COLORS.baseText,
              backgroundColor: 'transparent',
              fontFamily: FONT_FAMILY,
            }}
          >
            <img src={ASSETS.voyageMathIcon} alt="VoyageMath" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg, flexShrink: 0 }} />
            <img src={ASSETS.voyageMathText} alt="VoyageMath" style={{ height: FONT_SIZES.sm, flexShrink: 0 }} />
            <Icon icon="mdi:open-in-new" style={{ width: ICON_SIZES.sm, height: ICON_SIZES.sm, marginLeft: 'auto', color: COLORS.baseText }} />
          </button>
        </nav>

        {/* User Profile */}
        <div style={{ padding: `${SPACING[4]} ${SPACING[3]} ${SPACING[5]}` }}>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: SPACING[3],
              padding: `${SPACING[2]} ${SPACING[3]}`,
              borderRadius: BORDER_RADIUS.md,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              fontFamily: FONT_FAMILY,
            }}
          >
            <img
              src={ASSETS.userAvatar}
              alt="Ank Ank"
              style={{
                width: COMPONENT_SIZES.avatar.sm,
                height: COMPONENT_SIZES.avatar.sm,
                borderRadius: BORDER_RADIUS.full,
                objectFit: 'cover',
              }}
            />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.highlightedText, margin: 0, lineHeight: 1.3 }}>
                Ank Ank
              </p>
              <p style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.regular, color: COLORS.baseText, margin: 0, lineHeight: 1.3 }}>
                District
              </p>
            </div>
            <Icon icon="mdi:chevron-right" style={{ width: ICON_SIZES.lg, height: ICON_SIZES.lg, color: COLORS.baseText }} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: COLORS.white,
          position: 'relative',
        }}
      >
        {/* Top Section with Gradient */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${SPACING[14]} ${SPACING[14]} ${SPACING[4]} ${SPACING[14]}`,
            gap: SPACING[10],
            width: '100%',
            position: 'relative',
            background: GRADIENTS.pinkRadial,
          }}
        >
          {/* Enter Code - positioned top right */}
          <div style={{ position: 'absolute', top: SPACING[4], right: SPACING[6] }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[1],
                fontSize: FONT_SIZES.sm,
                fontWeight: FONT_WEIGHTS.regular,
                color: COLORS.baseText,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: `${SPACING[1]} ${SPACING[2]}`,
                fontFamily: FONT_FAMILY,
              }}
            >
              <Icon icon="mdi:apps" style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }} />
              <span>Enter code</span>
            </button>
          </div>

          {/* Greeting */}
          <h1 style={{ fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.highlightedText, margin: 0 }}>
            Hello Ank! <span>👋</span>
          </h1>

          {/* Tab Navigation Container */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: COLORS.white,
                  borderRadius: BORDER_RADIUS.lg,
                  boxShadow: SHADOWS.md,
                  border: `1px solid ${COLORS.borderGray}`,
                  overflow: 'hidden',
                }}
              >
                {/* Create Tab */}
                <button
                  onClick={() => setActiveTab('create')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${SPACING[4]} ${SPACING[8]} ${SPACING[3]}`,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    minWidth: COMPONENT_SIZES.tabButton.minWidth,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  <Icon
                    icon="mdi:pencil"
                    style={{
                      width: ICON_SIZES.lg,
                      height: ICON_SIZES.lg,
                      marginBottom: SPACING[1],
                      color: activeTab === 'create' ? COLORS.pink : COLORS.baseText,
                    }}
                  />
                  <span
                    style={{
                      fontSize: FONT_SIZES.md,
                      fontWeight: FONT_WEIGHTS.semibold,
                      color: activeTab === 'create' ? COLORS.pink : COLORS.highlightedText,
                      marginBottom: SPACING[0],
                    }}
                  >
                    Create
                  </span>
                  <span style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.regular, color: COLORS.baseText }}>a resource</span>
                </button>

                {/* Divider */}
                <div style={{ width: '1px', backgroundColor: COLORS.borderGray, margin: `${SPACING[3]} 0` }} />

                {/* Search Tab */}
                <button
                  onClick={() => setActiveTab('search')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${SPACING[4]} ${SPACING[8]} ${SPACING[3]}`,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    minWidth: COMPONENT_SIZES.tabButton.minWidth,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  <Icon
                    icon="mdi:magnify"
                    style={{
                      width: ICON_SIZES.lg,
                      height: ICON_SIZES.lg,
                      marginBottom: SPACING[1],
                      color: activeTab === 'search' ? COLORS.pink : COLORS.baseText,
                    }}
                  />
                  <span
                    style={{
                      fontSize: FONT_SIZES.md,
                      fontWeight: FONT_WEIGHTS.semibold,
                      color: activeTab === 'search' ? COLORS.pink : COLORS.highlightedText,
                      marginBottom: SPACING[0],
                    }}
                  >
                    Search
                  </span>
                  <span style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.regular, color: COLORS.baseText }}>for resources</span>
                </button>

                {/* Divider */}
                <div style={{ width: '1px', backgroundColor: COLORS.borderGray, margin: `${SPACING[3]} 0` }} />

                {/* Upload Tab */}
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: `${SPACING[4]} ${SPACING[8]} ${SPACING[3]}`,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    minWidth: COMPONENT_SIZES.tabButton.minWidth,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  <Icon
                    icon="mdi:tray-arrow-up"
                    style={{
                      width: ICON_SIZES.lg,
                      height: ICON_SIZES.lg,
                      marginBottom: SPACING[1],
                      color: activeTab === 'upload' ? COLORS.pink : COLORS.baseText,
                    }}
                  />
                  <span
                    style={{
                      fontSize: FONT_SIZES.md,
                      fontWeight: FONT_WEIGHTS.semibold,
                      color: activeTab === 'upload' ? COLORS.pink : COLORS.highlightedText,
                      marginBottom: SPACING[0],
                    }}
                  >
                    Upload
                  </span>
                  <span style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.regular, color: COLORS.baseText }}>& enhance your content</span>
                </button>
              </div>

              {/* Triangle Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: activeTab === 'create' ? 'calc(16.67% - 6px)' : activeTab === 'search' ? 'calc(50% - 6px)' : 'calc(83.33% - 6px)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: `8px solid ${COLORS.white}`,
                  transition: 'left 0.2s ease',
                  filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Type Cards */}
        <div style={{ padding: `0 ${SPACING[10]} ${SPACING[16]}` }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: SPACING[8],
              marginTop: SPACING[12],
              flexWrap: 'wrap',
            }}
          >
            {contentCards.map((card, index) => (
              <button
                key={index}
                onClick={card.onClick}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '160px',
                  padding: SPACING[4],
                  border: hoveredCard === index ? `2px solid ${COLORS.borderGray}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  borderRadius: BORDER_RADIUS.lg,
                  transition: 'all 0.15s ease',
                  fontFamily: FONT_FAMILY,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: COMPONENT_SIZES.cardIcon.size,
                    height: COMPONENT_SIZES.cardIcon.size,
                    marginBottom: SPACING[3],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontWeight: FONT_WEIGHTS.semibold,
                    color: COLORS.highlightedText,
                    margin: `0 0 ${SPACING[1]} 0`,
                    textAlign: 'center',
                  }}
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: FONT_SIZES.xs,
                    fontWeight: FONT_WEIGHTS.regular,
                    color: COLORS.baseText,
                    margin: 0,
                    lineHeight: 1.4,
                    textAlign: 'center',
                  }}
                >
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Help Button */}
        <button
          style={{
            position: 'fixed',
            bottom: SPACING[6],
            right: SPACING[6],
            width: COMPONENT_SIZES.helpButton.size,
            height: COMPONENT_SIZES.helpButton.size,
            borderRadius: BORDER_RADIUS.full,
            backgroundColor: COLORS.magenta,
            color: COLORS.white,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: SHADOWS.magenta,
            zIndex: 100,
          }}
        >
          <Icon icon="mdi:help" style={{ width: ICON_SIZES['2xl'], height: ICON_SIZES['2xl'] }} />
        </button>
      </main>
    </div>
  )
}
