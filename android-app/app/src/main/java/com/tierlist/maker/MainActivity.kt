package com.tierlist.maker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tierlist.maker.ui.navigation.NavRoute
import com.tierlist.maker.ui.screens.*
import com.tierlist.maker.ui.theme.TierListMakerTheme
import com.tierlist.maker.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TierListMakerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TierListMakerApp(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun TierListMakerApp(viewModel: MainViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = NavRoute.Home.route) {
        composable(NavRoute.Home.route) {
            HomeScreen(
                viewModel = viewModel,
                onNavigateToTierList = { folderId ->
                    navController.navigate(NavRoute.TierList.createRoute(folderId))
                },
                onNavigateToTrashArchive = { tab ->
                    navController.navigate(NavRoute.TrashArchive.createRoute(tab))
                },
                onNavigateToSettings = {
                    navController.navigate(NavRoute.AppSettings.route)
                },
                onNavigateToExportShare = { folderId ->
                    navController.navigate(NavRoute.ExportShare.createRoute(folderId))
                }
            )
        }

        composable(
            route = NavRoute.TierList.route,
            arguments = listOf(
                navArgument("folderId") { type = NavType.StringType },
                navArgument("highlightEntryId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""
            val highlightEntryId = backStackEntry.arguments?.getString("highlightEntryId")

            TierListScreen(
                folderId = folderId,
                highlightEntryId = highlightEntryId,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() },
                onNavigateToEntryForm = { fId, entryId ->
                    navController.navigate(NavRoute.EntryForm.createRoute(fId, entryId))
                },
                onNavigateToAddFromLink = { fId ->
                    navController.navigate(NavRoute.AddFromLink.createRoute(fId))
                },
                onNavigateToTierSettings = { fId ->
                    navController.navigate(NavRoute.TierSettings.createRoute(fId))
                },
                onNavigateToQuickRank = { fId ->
                    navController.navigate(NavRoute.QuickRank.createRoute(fId))
                },
                onNavigateToSnapshots = { fId ->
                    navController.navigate(NavRoute.SnapshotCompare.createRoute(fId))
                },
                onNavigateToStats = { fId ->
                    navController.navigate(NavRoute.FolderStats.createRoute(fId))
                },
                onNavigateToExport = { fId ->
                    navController.navigate(NavRoute.ExportShare.createRoute(fId))
                }
            )
        }

        composable(
            route = NavRoute.EntryForm.route,
            arguments = listOf(
                navArgument("folderId") { type = NavType.StringType },
                navArgument("entryId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("prefillTierId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("prefillTitle") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("prefillImageUrl") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""
            val entryId = backStackEntry.arguments?.getString("entryId")
            val prefillTierId = backStackEntry.arguments?.getString("prefillTierId")
            val prefillTitle = backStackEntry.arguments?.getString("prefillTitle")
            val prefillImageUrl = backStackEntry.arguments?.getString("prefillImageUrl")

            EntryFormScreen(
                folderId = folderId,
                entryId = entryId,
                prefillTierId = prefillTierId,
                prefillTitle = prefillTitle,
                prefillImageUrl = prefillImageUrl,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.AddFromLink.route,
            arguments = listOf(
                navArgument("folderId") { type = NavType.StringType },
                navArgument("targetTierId") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""

            AddFromLinkScreen(
                folderId = folderId,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.TierSettings.route,
            arguments = listOf(navArgument("folderId") { type = NavType.StringType })
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""

            TierSettingsScreen(
                folderId = folderId,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.QuickRank.route,
            arguments = listOf(
                navArgument("folderId") { type = NavType.StringType },
                navArgument("mode") { type = NavType.StringType; defaultValue = "rate" }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""
            val mode = backStackEntry.arguments?.getString("mode") ?: "rate"

            QuickRankScreen(
                folderId = folderId,
                initialMode = mode,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.SnapshotCompare.route,
            arguments = listOf(
                navArgument("folderId") { type = NavType.StringType },
                navArgument("tab") { type = NavType.StringType; defaultValue = "snapshots" }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""
            val tab = backStackEntry.arguments?.getString("tab") ?: "snapshots"

            SnapshotCompareScreen(
                folderId = folderId,
                initialTab = tab,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.FolderStats.route,
            arguments = listOf(navArgument("folderId") { type = NavType.StringType })
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""

            StatsScreen(
                folderId = folderId,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.ExportShare.route,
            arguments = listOf(navArgument("folderId") { type = NavType.StringType })
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""

            ExportShareScreen(
                folderId = folderId,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = NavRoute.TrashArchive.route,
            arguments = listOf(navArgument("tab") { type = NavType.StringType; defaultValue = "trash" })
        ) { backStackEntry ->
            val tab = backStackEntry.arguments?.getString("tab") ?: "trash"

            TrashArchiveScreen(
                initialTab = tab,
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(NavRoute.AppSettings.route) {
            AppSettingsScreen(
                viewModel = viewModel,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
