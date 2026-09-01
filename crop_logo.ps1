Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Philippines Freight\MainSystems\POS\public\Espresso Yourseld & Tea House - back.png"
$outPath = "c:\Users\Philippines Freight\MainSystems\POS\public\espresso-banner-cropped.png"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Original Size: $($bmp.Width) x $($bmp.Height)"

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Background is white / off-white (> 240 in all channels)
        if ($pixel.A -gt 20 -and ($pixel.R -lt 240 -or $pixel.G -lt 240 -or $pixel.B -lt 240)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Content bounds: X=$minX to $maxX, Y=$minY to $maxY"

$cropWidth = $maxX - $minX + 1
$cropHeight = $maxY - $minY + 1
Write-Host "Cropped Size: $cropWidth x $cropHeight"

$rect = [System.Drawing.Rectangle]::new($minX, $minY, $cropWidth, $cropHeight)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)
$bmp.Dispose()

$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

Write-Host "Successfully saved cropped logo to: $outPath"
