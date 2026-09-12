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
  onNavigate,
  onOpenPreview,
}) {
  const {
    colors,
    spacing,
    radius,
  } = useTheme();

  const recentProjects =
    projects.slice(0, 5);

  const getProjectName = (project) =>
    project?.name ||
    project?.title ||
    'Projet sans nom';

  const getProjectDescription = (
    project
  ) =>
    project?.description ||
    'Projet GCODE';

  const getProjectDate = (project) => {
    if (
      !project?.updatedAt &&
      !project?.createdAt
    ) {
      return 'Projet récent';
    }

    const date = new Date(
      project.updatedAt ||
        project.createdAt
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return 'Projet récent';
    }

    return `Modifié le ${date.toLocaleDateString()}`;
  };

  const handlePreview = () => {
    if (
      typeof onOpenPreview ===
      'function' &&
      projects.length > 0
    ) {
      /*
       * Le Preview travaille sur le projet
       * actuellement ouvert dans App.js.
       *
       * Depuis l'accueil, on ouvre donc le
       * dernier projet disponible.
       */
      const project =
        projects[0];

      if (
        project &&
        typeof onOpenProject ===
          'function'
      ) {
        onOpenProject(project);

        /*
         * App.js change l'écran vers
         * Workbench. Le Preview sera
         * accessible depuis le Workbench.
         */
      }
    }
  };

  const handleViewAll = () => {
    if (
      typeof onNavigate ===
      'function'
    ) {
      onNavigate('projects');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal:
              spacing.md,
            paddingBottom:
              spacing.xxl,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View
            style={
              styles.brandContainer
            }
          >
            <Image
              source={require(
                '../../assets/gcode-icon-new.png'
              )}
              style={styles.logo}
              resizeMode="contain"
            />

            <View>
              <Text
                style={[
                  styles.brand,
                  {
                    color:
                      colors.textStrong,
                  },
                ]}
              >
                GCODE
              </Text>

              <Text
                style={[
                  styles.version,
                  {
                    color:
                      colors.muted,
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
                backgroundColor:
                  colors.panel2,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    colors.green,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    colors.muted,
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
                color:
                  colors.muted,
              },
            ]}
          >
            Bonjour 👋
          </Text>

          <Text
            style={[
              styles.title,
              {
                color:
                  colors.textStrong,
              },
            ]}
          >
            Crée quelque chose
            {'\n'}
            <Text
              style={{
                color:
                  colors.purple,
              }}
            >
              d’exception.
            </Text>
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Ton environnement de
            développement
            {'\n'}
            directement dans ta poche.
          </Text>
        </View>

        {/* CREATE PROJECT */}
        <Pressable
          onPress={
            onCreateProject
          }
          accessibilityRole="button"
          accessibilityLabel="Créer un nouveau projet"
          style={({ pressed }) => [
            styles.createCard,
            {
              backgroundColor:
                colors.purple,
              borderRadius:
                radius.lg,
              opacity: pressed
                ? 0.88
                : 1,
              transform: [
                {
                  scale: pressed
                    ? 0.985
                    : 1,
                },
              ],
            },
          ]}
        >
          <View
            style={
              styles.createContent
            }
          >
            <View
              style={[
                styles.createIcon,
                {
                  backgroundColor:
                    'rgba(255,255,255,0.16)',
                },
              ]}
            >
              <Text
                style={styles.plus}
              >
                +
              </Text>
            </View>

            <View
              style={
                styles.createTextContainer
              }
            >
              <Text
                style={
                  styles.createTitle
                }
              >
                Nouveau projet
              </Text>

              <Text
                style={
                  styles.createSubtitle
                }
              >
                Commencer un nouveau
                projet
              </Text>
            </View>
          </View>

          <View
            style={
              styles.arrowContainer
            }
          >
            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </View>
        </Pressable>

        {/* QUICK ACTIONS */}
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.textStrong,
              },
            ]}
          >
            Accès rapide
          </Text>
        </View>

        <View
          style={
            styles.quickGrid
          }
        >
          <QuickAction
            icon="⌘"
            title="Commandes"
            subtitle="Bientôt"
            disabled
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="AI"
            title="GCODE AI"
            subtitle="Bientôt"
            disabled
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="▶"
            title="Terminal"
            subtitle="Bientôt"
            disabled
            colors={colors}
            radius={radius}
          />

          <QuickAction
            icon="◈"
            title="Preview"
            subtitle={
              projects.length > 0
                ? 'Ouvrir'
                : 'Aucun projet'
            }
            disabled={
              projects.length === 0
            }
            onPress={
              handlePreview
            }
            colors={colors}
            radius={radius}
          />
        </View>

        {/* RECENT PROJECTS */}
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.textStrong,
              },
            ]}
          >
            Projets récents
          </Text>

          {projects.length > 0 && (
            <Pressable
              onPress={
                handleViewAll
              }
              accessibilityRole="button"
              accessibilityLabel="Voir tous les projets"
              hitSlop={10}
            >
              <Text
                style={[
                  styles.viewAll,
                  {
                    color:
                      colors.purple,
                  },
                ]}
              >
                Voir tout
              </Text>
            </Pressable>
          )}
        </View>

        {recentProjects.length ===
        0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor:
                  colors.panel,
                borderColor:
                  colors.border,
                borderRadius:
                  radius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    colors.panel2,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyIconText,
                  {
                    color:
                      colors.purple,
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
                  color:
                    colors.textStrong,
                },
              ]}
            >
              Aucun projet pour le
              moment
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              Crée ton premier projet
              pour commencer à coder
              avec GCODE.
            </Text>

            <Pressable
              onPress={
                onCreateProject
              }
              accessibilityRole="button"
              accessibilityLabel="Créer un projet"
              style={({
                pressed,
              }) => [
                styles.emptyButton,
                {
                  backgroundColor:
                    colors.panel2,
                  borderColor:
                    colors.border,
                  opacity: pressed
                    ? 0.75
                    : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyButtonText,
                  {
                    color:
                      colors.purple,
                  },
                ]}
              >
                Créer un projet
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={
              styles.projectsList
            }
          >
            {recentProjects.map(
              (project, index) => (
                <Pressable
                  key={
                    project.id ||
                    `${getProjectName(
                      project
                    )}-${index}`
                  }
                  onPress={() =>
                    onOpenProject?.(
                      project
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir ${getProjectName(
                    project
                  )}`}
                  style={({
                    pressed,
                  }) => [
                    styles.projectCard,
                    {
                      backgroundColor:
                        colors.panel,
                      borderColor:
                        colors.border,
                      borderRadius:
                        radius.md,
                      opacity:
                        pressed
                          ? 0.78
                          : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.projectIcon,
                      {
                        backgroundColor:
                          colors.panel2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.projectIconText,
                        {
                          color:
                            colors.purple,
                        },
                      ]}
                    >
                      {'</>'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.projectInfo
                    }
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.projectName,
                        {
                          color:
                            colors.textStrong,
                        },
                      ]}
                    >
                      {getProjectName(
                        project
                      )}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.projectDescription,
                        {
                          color:
                            colors.muted,
                        },
                      ]}
                    >
                      {getProjectDescription(
                        project
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.projectDate,
                        {
                          color:
                            colors.muted2,
                        },
                      ]}
                    >
                      {getProjectDate(
                        project
                      )}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.projectArrow,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    ›
                  </Text>
                </Pressable>
              )
            )}
          </View>
        )}

        {/* GCODE AI BANNER */}
        <View
          style={[
            styles.aiCard,
            {
              backgroundColor:
                colors.panel,
              borderColor:
                colors.border,
              borderRadius:
                radius.lg,
            },
          ]}
        >
          <View
            style={[
              styles.aiIcon,
              {
                backgroundColor:
                  colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.aiIconText,
                {
                  color:
                    colors.purple,
                },
              ]}
            >
              AI
            </Text>
          </View>

          <View
            style={styles.aiContent}
          >
            <Text
              style={[
                styles.aiTitle,
                {
                  color:
                    colors.textStrong,
                },
              ]}
            >
              GCODE AI
            </Text>

            <Text
              style={[
                styles.aiDescription,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              Assistant IA optionnel.
              Cette fonction sera
              activée dans une prochaine
              version.
            </Text>
          </View>

          <View
            style={[
              styles.comingBadge,
              {
                backgroundColor:
                  colors.panel2,
              },
            ]}
          >
            <Text
              style={[
                styles.comingBadgeText,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              Bientôt
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View
          style={styles.footer}
        >
          <Text
            style={[
              styles.footerText,
              {
                color:
                  colors.muted2,
              },
            ]}
          >
            GCODE MOBILE V3
          </Text>

          <Text
            style={[
              styles.footerDot,
              {
                color:
                  colors.borderStrong,
              },
            ]}
          >
            •
          </Text>

          <Text
            style={[
              styles.footerText,
              {
                color:
                  colors.muted2,
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
  disabled = false,
  onPress,
  colors,
  radius,
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${subtitle}`}
      accessibilityState={{
        disabled,
      }}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor:
            colors.panel,
          borderColor:
            colors.border,
          borderRadius:
            radius.md,
          opacity: disabled
            ? 0.48
            : pressed
              ? 0.75
              : 1,
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor:
              colors.panel2,
          },
        ]}
      >
        <Text
          style={[
            styles.quickIconText,
            {
              color:
                colors.purple,
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
            color:
              colors.textStrong,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.quickSubtitle,
          {
            color:
              disabled
                ? colors.muted2
                : colors.muted,
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
    justifyContent:
      'space-between',
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
    justifyContent:
      'space-between',
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
    fontWeight: '800',
  },

  createSubtitle: {
    color:
      'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 4,
  },

  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.12)',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '700',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginBottom: 30,
  },

  quickCard: {
    width: '48.2%',
    minHeight: 132,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },

  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  quickIconText: {
    fontSize: 17,
    fontWeight: '800',
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  quickSubtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },

  projectsList: {
    marginBottom: 30,
  },

  projectCard: {
    minHeight: 82,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
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
  },

  projectName: {
    fontSize: 14,
    fontWeight: '800',
  },

  projectDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  projectDate: {
    fontSize: 9,
    marginTop: 5,
  },

  projectArrow: {
    fontSize: 26,
    marginLeft: 8,
  },

  emptyCard: {
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyIconText: {
    fontSize: 18,
    fontWeight: '800',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },

  emptyButton: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

  aiCard: {
    minHeight: 96,
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  aiIconText: {
    fontSize: 13,
    fontWeight: '900',
  },

  aiContent: {
    flex: 1,
  },

  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  aiDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
  },

  comingBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },

  comingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  footerText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  footerDot: {
    marginHorizontal: 8,
    fontSize: 10,
  },
});
