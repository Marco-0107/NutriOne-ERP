param(
    [string]$InputPath = "C:\Users\vlogs\Desktop\UBB\2026-1\Proyectos TI\Proyecto_NutriOne.mpp",
    [string]$OutPath = "C:\Users\vlogs\NutriOne-ERP\tmp\mpp-review\Proyecto_NutriOne_export.json"
)

$ErrorActionPreference = "Stop"

function Get-Value {
    param($Object, [string]$Name)
    try {
        $value = $Object.$Name
        if ($null -eq $value) { return $null }
        return $value
    }
    catch {
        return $null
    }
}

function To-Text {
    param($Value)
    if ($null -eq $Value) { return $null }
    return [string]$Value
}

$app = $null
try {
    $app = New-Object -ComObject MSProject.Application
    $app.Visible = $false
    $app.DisplayAlerts = $false
    $app.FileOpenEx($InputPath, $true) | Out-Null
    $project = $app.ActiveProject

    $tasks = @()
    foreach ($task in $project.Tasks) {
        if ($null -eq $task) { continue }
        $tasks += [pscustomobject]@{
            Id = Get-Value $task "ID"
            Uid = Get-Value $task "UniqueID"
            Name = To-Text (Get-Value $task "Name")
            OutlineNumber = To-Text (Get-Value $task "OutlineNumber")
            OutlineLevel = Get-Value $task "OutlineLevel"
            Summary = Get-Value $task "Summary"
            Milestone = Get-Value $task "Milestone"
            Active = Get-Value $task "Active"
            Start = To-Text (Get-Value $task "Start")
            Finish = To-Text (Get-Value $task "Finish")
            DurationMinutes = Get-Value $task "Duration"
            DurationText = To-Text (Get-Value $task "DurationText")
            WorkMinutes = Get-Value $task "Work"
            Cost = Get-Value $task "Cost"
            FixedCost = Get-Value $task "FixedCost"
            PercentComplete = Get-Value $task "PercentComplete"
            Critical = Get-Value $task "Critical"
            TotalSlackMinutes = Get-Value $task "TotalSlack"
            Predecessors = To-Text (Get-Value $task "Predecessors")
            Successors = To-Text (Get-Value $task "Successors")
            ResourceNames = To-Text (Get-Value $task "ResourceNames")
            Notes = To-Text (Get-Value $task "Notes")
        }
    }

    $resources = @()
    foreach ($resource in $project.Resources) {
        if ($null -eq $resource) { continue }
        if ([string]::IsNullOrWhiteSpace([string](Get-Value $resource "Name"))) { continue }
        $resources += [pscustomobject]@{
            Id = Get-Value $resource "ID"
            Uid = Get-Value $resource "UniqueID"
            Name = To-Text (Get-Value $resource "Name")
            Type = Get-Value $resource "Type"
            Initials = To-Text (Get-Value $resource "Initials")
            Group = To-Text (Get-Value $resource "Group")
            MaxUnits = Get-Value $resource "MaxUnits"
            StandardRate = To-Text (Get-Value $resource "StandardRate")
            CostPerUse = Get-Value $resource "CostPerUse"
            MaterialLabel = To-Text (Get-Value $resource "MaterialLabel")
            Cost = Get-Value $resource "Cost"
            WorkMinutes = Get-Value $resource "Work"
        }
    }

    $assignments = @()
    foreach ($assignment in $project.Assignments) {
        if ($null -eq $assignment) { continue }
        $task = Get-Value $assignment "Task"
        $resource = Get-Value $assignment "Resource"
        $assignments += [pscustomobject]@{
            TaskId = Get-Value $assignment "TaskID"
            TaskName = if ($null -ne $task) { To-Text (Get-Value $task "Name") } else { $null }
            ResourceId = Get-Value $assignment "ResourceID"
            ResourceName = if ($null -ne $resource) { To-Text (Get-Value $resource "Name") } else { $null }
            Units = Get-Value $assignment "Units"
            WorkMinutes = Get-Value $assignment "Work"
            Cost = Get-Value $assignment "Cost"
            Start = To-Text (Get-Value $assignment "Start")
            Finish = To-Text (Get-Value $assignment "Finish")
        }
    }

    $summary = $project.ProjectSummaryTask
    $data = [pscustomobject]@{
        Project = [pscustomobject]@{
            Name = To-Text (Get-Value $project "Name")
            Title = To-Text (Get-Value $project "Title")
            Author = To-Text (Get-Value $project "Author")
            Start = To-Text (Get-Value $project "ProjectStart")
            Finish = To-Text (Get-Value $project "ProjectFinish")
            CurrentDate = To-Text (Get-Value $project "CurrentDate")
            SummaryName = To-Text (Get-Value $summary "Name")
            SummaryStart = To-Text (Get-Value $summary "Start")
            SummaryFinish = To-Text (Get-Value $summary "Finish")
            SummaryDurationMinutes = Get-Value $summary "Duration"
            SummaryWorkMinutes = Get-Value $summary "Work"
            SummaryCost = Get-Value $summary "Cost"
        }
        Tasks = $tasks
        Resources = $resources
        Assignments = $assignments
    }

    $data | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $OutPath -Encoding UTF8
    Write-Output $OutPath
}
finally {
    if ($null -ne $app) {
        try { $app.FileCloseAll(2) | Out-Null } catch {}
        try { $app.Quit() | Out-Null } catch {}
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) } catch {}
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
    }
}
