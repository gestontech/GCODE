import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function HomeScreen({
  projects = [],
  onCreateProject,
  onOpenProject,
}) {
  const { colors, spacing, radius } = useTheme();

  const recentProjects = projects.slice(0, 5);

  const getProjectName = (project) => {
    return project?.name || project?.title || 'Projet sans nom';
  };

  const getProjectDescription = (project) => {
    return project?.description || 'Projet GCODE';
  };

  const getProjectDate = (project) => {
    if (!project?.updatedAt && !project?.createdAt) {
      return 'Projet récent';
    }

    const date = new Date(project.updatedAt || project.createdAt);

    if (Number.isNaN(date.getTime())) {
      return 'Projet récent';
    }

    return `Modifié le ${date.toLocaleDateString()}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xxl,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/gcode-icon-new.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View>
              <Text
                style={[
                  styles.brand,
                  {
                    color: colors.textStrong,
                  },
                ]}
              >
                GCODE
              </Text>

              <Text
                style={[
                  styles.version,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                MOBILE V3
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.status,
              {
                backgroundColor: colors.panel2,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: colors.green,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: colors.muted,
                },
              ]}
            >
              Prêt
            </Text>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <Text
            style={[
              styles.greeting,
              {
                color: colors.muted,
              },
            ]}
          >
            Bonjour 👋
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.textStrong,
              },
            ]}
          >
            Crée quelque chose
            {'\n'}
            <Text style={{ color: colors.purple }}>
              d’exception.
            </Text>
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.muted,
              },
            ]}
          >
            Ton environnement de développement
            {'\n'}
            directement dans ta poche.
          </Text>
        </View>

        {/* CREATE PROJECT */}
        <Pressable
          onPress={onCreateProject}
          style={({ pressed }) => [
            styles.createCard,
            {
              backgroundColor: colors.purple,
              borderRadius: radius.lg,
              opacity: pressed ? 0.88 : 1,
              transform: [
                {
                  scale: pressed ? 0.985 : 1,
                },
              ],
            },
          ]}
        >
          <View style={styles.createContent}>
            <View
              style={[
                styles.createIcon,
                {
                  backgroundColor: 'rgba(255,255,255,0.16)',
                },
              ]}
            >
              <Text style={styles.plus}>+</Text>
            </View>

            <View style={styles.createTextContainer}>
              <Text style={styles.createTitle}>
                Nouveau projet
              </Text>

              <Text style={styles.createSubtitle}>
                Commencer un nouveau projet
              </Text>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </Pressable>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textStrong,
              },
            ]}
          >
            Accès rapide
          </Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="⌘"
            title="Commandes"
            subtitle="Palette"
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="AI"
            title="GCODE AI"
            subtitle="Assistant"
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="▶"
            title="Terminal"
            subtitle="Console"
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="◈"
            title="Preview"
            subtitle="Aperçu"
            colors={colors}
            radius={radius}
          />
        </View>

        {/* RECENT PROJECTS */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textStrong,
              },
            ]}
          >
            Projets récents
          </Text>

          {projects.length > 0 && (
            <Text
              style={[
                styles.viewAll,
                {
                  color: colors.purple,
                },
              ]}
            >
              Voir tout
            </Text>
          )}
        </View>

        {recentProjects.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyIconText,
                  {
                    color: colors.purple,
                  },
                ]}
              >
                {'</>'}
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.textStrong,
                },
              ]}
            >
              Aucun projet pour le moment
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.muted,
                },
              ]}
            >
              Crée ton premier projet pour commencer
              à coder avec GCODE.
            </Text>

            <Pressable
              onPress={onCreateProject}
              style={({ pressed }) => [
                styles.emptyButton,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyButtonText,
                  {
                    color: colors.purple,
                  },
                ]}
              >
                Créer un projet
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.projectsList}>
            {recentProjects.map((project, index) => (
              <Pressable
                key={project.id || `${getProjectName(project)}-${index}`}
                onPress={() => onOpenProject?.(project)}
                style={({ pressed }) => [
                  styles.projectCard,
                  {
                    backgroundColor: colors.panel,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.projectIcon,
                    {
                      backgroundColor: colors.panel2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.projectIconText,
                      {
                        color: colors.purple,
                      },
                    ]}
                  >
                    {'</>'}
                  </Text>
                </View>

                <View style={styles.projectInfo}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.projectName,
                      {
                        color: colors.textStrong,
                      },
                    ]}
                  >
                    {getProjectName(project)}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.projectDescription,
                      {
                        color: colors.muted,
                      },
                    ]}
                  >
                    {getProjectDescription(project)}
                  </Text>

                  <Text
                    style={[
                      styles.projectDate,
                      {
                        color: colors.muted2,
                      },
                    ]}
                  >
                    {getProjectDate(project)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.projectArrow,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  ›
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* GCODE AI BANNER */}
        <View
          style={[
            styles.aiCard,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <View
            style={[
              styles.aiIcon,
              {
                backgroundColor: colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.aiIconText,
                {
                  color: colors.purple,
                },
              ]}
            >
              AI
            </Text>
          </View>

          <View style={styles.aiContent}>
            <Text
              style={[
                styles.aiTitle,
                {
                  color: colors.textStrong,
                },
              ]}
            >
              GCODE AI
            </Text>

            <Text
              style={[
                styles.aiDescription,
                {
                  color: colors.muted,
                },
              ]}
            >
              Décris ton idée. GCODE peut t’aider
              à construire ton projet.
            </Text>
          </View>

          <Text
            style={[
              styles.aiArrow,
              {
                color: colors.purple,
              },
            ]}
          >
            ›
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color: colors.muted2,
              },
            ]}
          >
            GCODE MOBILE V3
          </Text>

          <Text
            style={[
              styles.footerDot,
              {
                color: colors.borderStrong,
              },
            ]}
          >
            •
          </Text>

          <Text
            style={[
              styles.footerText,
              {
                color: colors.muted2,
              },
            ]}
          >
            Build your future
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  colors,
  radius,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          borderRadius: radius.md,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: colors.panel2,
          },
        ]}
      >
        <Text
          style={[
            styles.quickIconText,
            {
              color: colors.purple,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.quickTitle,
          {
            color: colors.textStrong,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.quickSubtitle,
          {
            color: colors.muted,
          },
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 42,
    height: 42,
    marginRight: 11,
  },

  brand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  version: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.4,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 999,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  hero: {
    marginBottom: 26,
  },

  greeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },

  createCard: {
    minHeight: 94,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  createContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  createIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  plus: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  },

  createTextContainer: {
    flex: 1,
  },

  createTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  createSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 17,
  },

  arrowContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '600',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  quickCard: {
    width: '48.3%',
    minHeight: 116,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  quickIconText: {
    fontSize: 13,
    fontWeight: '800',
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  quickSubtitle: {
    fontSize: 11,
  },

  emptyCard: {
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyIconText: {
    fontSize: 17,
    fontWeight: '800',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 7,
    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 290,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },

  emptyButton: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  projectsList: {
    marginBottom: 20,
  },

  projectCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 9,
  },

  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  projectIconText: {
    fontSize: 14,
    fontWeight: '800',
  },

  projectInfo: {
    flex: 1,
    minWidth: 0,
  },

  projectName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  projectDescription: {
    fontSize: 11,
    marginBottom: 4,
  },

  projectDate: {
    fontSize: 9,
  },

  projectArrow: {
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },

  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    marginTop: 5,
  },

  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aiIconText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  aiContent: {
    flex: 1,
  },

  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  aiDescription: {
    fontSize: 11,
    lineHeight: 16,
  },

  aiArrow: {
    fontSize: 25,
    marginLeft: 8,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  footerText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.7,
  },

  footerDot: {
    marginHorizontal: 7,
    fontSize: 10,
  },
});
