# Batch ESLint Fixes for World Engine
# Fixes common unused parameter patterns

$files = @(
    # Core action files
    "src\core\action\effects.ts",
    "src\core\action\hex.ts",
    "src\core\action\types.ts",
    
    # Core creator files  
    "src\core\creator\builder.ts",
    "src\core\creator\rules.ts",
    "src\core\creator\seed.ts",
    "src\core\creator\validate.ts",
    
    # Core engine
    "src\core\engine\index.ts",
    
    # Core save
    "src\core\save\index.ts",
    "src\core\save\migrate.ts",
    
    # Core services
    "src\core\services\random.ts",
    "src\core\services\storage.ts",
    
    # Core spell
    "src\core\spell\action-glue.ts",
    "src\core\spell\resolver.ts",
    "src\core\spell\selectors.ts",
    
    # Core terrain
    "src\core\terrain\los.blockers.ts",
    "src\core\terrain\tiled.ts",
    
    # Core turn
    "src\core\turn\round.scheduler.ts",
    "src\core\turn\types.ts",
    
    # Core unit
    "src\core\unit\damage.ts",
    "src\core\unit\status.ts",
    "src\core\unit\types.ts"
)

$patterns = @(
    # Function parameters that are intentionally unused
    @{Find = '\(origin:'; Replace = '(_origin:' },
    @{Find = ', origin\)'; Replace = ', _origin)' },
    @{Find = '\(h:'; Replace = '(_h:' },
    @{Find = ', h\)'; Replace = ', _h)' },
    @{Find = '\(pos:'; Replace = '(_pos:' },
    @{Find = ', pos\)'; Replace = ', _pos)' },
    @{Find = '\(slotId:'; Replace = '(_slotId:' },
    @{Find = ', slotId\)'; Replace = ', _slotId)' },
    @{Find = '\(data:'; Replace = '(_data:' },
    @{Find = ', data\)'; Replace = ', _data)' },
    @{Find = '\(description:'; Replace = '(_description:' },
    @{Find = ', description\)'; Replace = ', _description)' },
    @{Find = '\(key:'; Replace = '(_key:' },
    @{Find = ', key\)'; Replace = ', _key)' },
    @{Find = '\(value:'; Replace = '(_value:' },
    @{Find = ', value\)'; Replace = ', _value)' },
    @{Find = '\(storage:'; Replace = '(_storage:' },
    @{Find = ', storage\)'; Replace = ', _storage)' },
    @{Find = '\(world:'; Replace = '(_world:' },
    @{Find = ', world\)'; Replace = ', _world)' },
    @{Find = '\(ctx:'; Replace = '(_ctx:' },
    @{Find = ', ctx\)'; Replace = ', _ctx)' },
    @{Find = '\(u:'; Replace = '(_u:' },
    @{Find = ', u\)'; Replace = ', _u)' },
    @{Find = '\(dmgInOut:'; Replace = '(_dmgInOut:' },
    @{Find = ', dmgInOut\)'; Replace = ', _dmgInOut)' },
    @{Find = '\(min:'; Replace = '(_min:' },
    @{Find = ', min\)'; Replace = ', _min)' },
    @{Find = '\(max:'; Replace = '(_max:' },
    @{Find = ', max\)'; Replace = ', _max)' },
    @{Find = '\(values:'; Replace = '(_values:' },
    @{Find = ', values\)'; Replace = ', _values)' },
    @{Find = '\(input:'; Replace = '(_input:' },
    @{Find = ', input\)'; Replace = ', _input)' },
    @{Find = '\(level:'; Replace = '(_level:' },
    @{Find = ', level\)'; Replace = ', _level)' },
    @{Find = '\(rewards:'; Replace = '(_rewards:' },
    @{Find = ', rewards\)'; Replace = ', _rewards)' },
    @{Find = '\(aoeSize:'; Replace = '(_aoeSize:' },
    @{Find = ', aoeSize\)'; Replace = ', _aoeSize)' },
    @{Find = '\(a:'; Replace = '(_a:' },
    @{Find = ', a\)'; Replace = ', _a)' },
    @{Find = '\(verdict:'; Replace = '(_verdict:' },
    @{Find = ', verdict\)'; Replace = ', _verdict)' },
    @{Find = '\(r:'; Replace = '(_r:' },
    @{Find = ', r\)'; Replace = ', _r)' },
    @{Find = '\(n:'; Replace = '(_n:' },
    @{Find = ', n\)'; Replace = ', _n)' }
)

$fixedCount = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        
        foreach ($pattern in $patterns) {
            $content = $content -replace $pattern.Find, $pattern.Replace
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            $fixedCount++
            Write-Host "✓ Fixed: $file" -ForegroundColor Green
        }
    }
}

Write-Host "`n✅ Fixed $fixedCount files" -ForegroundColor Cyan
